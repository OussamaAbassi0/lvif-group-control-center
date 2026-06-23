/**
 * POST /api/sync/pennylane
 * Synchronisation Pennylane → Supabase (factures)
 * Appelé par n8n (cron toutes les heures)
 * Sécurisé par CRON_SECRET header
 */

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "edge";

const COMPANY_NAME_MAP: Record<string, string> = {
  "LED Visual Innovation France": "bd202302-fc88-4456-a998-2ea856839386",
  "LVIF":                          "bd202302-fc88-4456-a998-2ea856839386",
  "Eno Events":                    "f286cc0b-3201-4941-90d8-e08edef40e80",
  "TJM Advertising Network":       "6474b945-4f0d-4eaa-875b-2e172c2d97ea",
  "TJM":                           "6474b945-4f0d-4eaa-875b-2e172c2d97ea",
};

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Récupérer factures Pennylane (client + fournisseur)
    const [clientInvoicesRes, supplierInvoicesRes] = await Promise.all([
      fetch("https://app.pennylane.com/api/external/v1/customer_invoices?per_page=50&page=1", {
        headers: {
          Authorization: `Bearer ${process.env.PENNYLANE_TOKEN}`,
          Accept: "application/json",
        },
      }),
      fetch("https://app.pennylane.com/api/external/v1/supplier_invoices?per_page=50&page=1", {
        headers: {
          Authorization: `Bearer ${process.env.PENNYLANE_TOKEN}`,
          Accept: "application/json",
        },
      }),
    ]);

    if (!clientInvoicesRes.ok || !supplierInvoicesRes.ok) {
      throw new Error(`Pennylane API error: ${clientInvoicesRes.status}/${supplierInvoicesRes.status}`);
    }

    const clientData = await clientInvoicesRes.json();
    const supplierData = await supplierInvoicesRes.json();

    const clientInvoices = clientData.invoices || [];
    const supplierInvoices = supplierData.invoices || [];

    // Mapper les factures clients
    const receivableUpserts = clientInvoices.map((inv: Record<string, unknown>) => ({
      company_id: resolveCompanyId(inv.company_name as string),
      type: "receivable" as const,
      counterparty: (inv.customer as { name?: string })?.name || String(inv.customer || "Inconnu"),
      amount: Number(inv.amount || 0),
      status: mapPennylaneStatus(String(inv.status || "")),
      issue_date: String(inv.date || new Date().toISOString().split("T")[0]),
      due_date: inv.due_date ? String(inv.due_date) : null,
      reference: String(inv.invoice_number || ""),
      source: "pennylane",
    })).filter((i: { company_id: string | undefined }) => i.company_id);

    // Mapper les factures fournisseurs
    const payableUpserts = supplierInvoices.map((inv: Record<string, unknown>) => ({
      company_id: resolveCompanyId(inv.company_name as string),
      type: "payable" as const,
      counterparty: (inv.supplier as { name?: string })?.name || String(inv.supplier || "Inconnu"),
      amount: Number(inv.amount || 0),
      status: mapPennylaneStatus(String(inv.status || "")),
      issue_date: String(inv.date || new Date().toISOString().split("T")[0]),
      due_date: inv.due_date ? String(inv.due_date) : null,
      reference: String(inv.invoice_number || ""),
      source: "pennylane",
    })).filter((i: { company_id: string | undefined }) => i.company_id);

    const allUpserts = [...receivableUpserts, ...payableUpserts];

    let syncedCount = 0;
    if (allUpserts.length > 0) {
      const { count, error } = await supabase
        .from("invoices")
        .upsert(allUpserts, { onConflict: "reference,company_id", count: "exact" });
      if (error) throw error;
      syncedCount = count ?? 0;
    }

    return NextResponse.json({
      success: true,
      synced: syncedCount,
      receivable: receivableUpserts.length,
      payable: payableUpserts.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("[sync/pennylane] Error:", error);
    return NextResponse.json(
      {
        error: "Sync failed",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function resolveCompanyId(name: string): string | undefined {
  if (!name) return undefined;
  for (const [key, id] of Object.entries(COMPANY_NAME_MAP)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return id;
  }
  return undefined;
}

function mapPennylaneStatus(status: string): string {
  const map: Record<string, string> = {
    draft:          "draft",
    submitted:      "sent",
    approved:       "sent",
    partially_paid: "sent",
    paid:           "paid",
    cancelled:      "paid", // traité comme payé pour ne plus alerter
    overdue:        "overdue",
    late:           "overdue",
  };
  return map[status.toLowerCase()] || "sent";
}
