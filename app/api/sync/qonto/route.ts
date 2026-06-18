/**
 * POST /api/sync/qonto
 * Synchronisation Qonto → Supabase (soldes + transactions)
 * Appelé par n8n
 */

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "edge";

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
    // 1. Récupérer les comptes Qonto
    const accountsRes = await fetch(
      "https://thirdparty.qonto.com/v2/organization",
      {
        headers: {
          Authorization: `${process.env.QONTO_ORG_SLUG}:${process.env.QONTO_API_KEY}`,
        },
      }
    );

    if (!accountsRes.ok) {
      throw new Error(`Qonto API error: ${accountsRes.status}`);
    }

    const qontoData = await accountsRes.json();
    const bankAccounts = qontoData.organization?.bank_accounts || [];

    for (const account of bankAccounts) {
      // Trouver la société correspondante via le nom du compte
      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .ilike("name", `%${account.name?.split(" ")[0]}%`)
        .single();

      if (!company) continue;

      // Upsert du compte bancaire
      await supabase.from("bank_accounts").upsert(
        {
          company_id: company.id,
          bank_name: "Qonto",
          account_name: account.name,
          iban: account.iban,
          balance: account.balance_cents / 100,
          currency: account.currency,
          source: "qonto_api",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "company_id,bank_name,account_name" }
      );
    }

    return NextResponse.json({
      success: true,
      accounts_synced: bankAccounts.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[sync/qonto] Error:", error);
    return NextResponse.json(
      { error: "Sync failed", detail: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
