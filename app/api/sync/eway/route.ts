/**
 * POST /api/sync/eway
 * Synchronisation eWay CRM (WCF API) → Supabase
 * Sécurisé par CRON_SECRET header
 *
 * eWay CRM utilise une API WCF :
 *   Base URL : https://hosting.eway-crm.com/sas_lvif/API.svc
 *   Auth     : POST /LogIn avec userName + passwordHash (MD5)
 *   Leads    = "Deals" dans l'interface eWay
 */

import { createClient } from "@supabase/supabase-js";
import { NextResponse }  from "next/server";
import { createHash }    from "crypto";

export const runtime = "nodejs";

// URL spécifique au compte LVIF (sas_lvif = identifiant de l'instance)
const EWAY_BASE = "https://hosting.eway-crm.com/sas_lvif/API.svc";

function md5(str: string) {
  return createHash("md5").update(str).digest("hex");
}

async function ewayPost(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${EWAY_BASE}${path}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`eWay ${path} HTTP ${res.status}`);
  return res.json();
}

const STAGE_MAP: { [key: string]: string } = {
  "":              "prospect",
  "New":           "prospect",
  "Qualification": "qualification",
  "Proposal":      "proposition",
  "Negotiation":   "negociation",
  "Won":           "gagne",
  "Lost":          "perdu",
  "Closed":        "gagne",
};

function mapStage(stage: string | null | undefined) {
  if (!stage) return "prospect";
  if (stage in STAGE_MAP) return STAGE_MAP[stage];
  for (const [k, v] of Object.entries(STAGE_MAP)) {
    if (stage.toLowerCase().includes(k.toLowerCase())) return v;
  }
  return "prospect";
}

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  try {
    const loginData = await ewayPost("/LogIn", {
      userName:                process.env.EWAY_USERNAME,
      passwordHash:            md5(process.env.EWAY_PASSWORD),
      appVersion:              "LVIF Dashboard 1.0.0",
      clientMachineIdentifier: "lvif-control-center",
      clientMachineName:       "LVIF-CONTROL-CENTER",
      databaseVersion:         0,
    });

    if (loginData.ReturnCode !== "rcSuccess") {
      throw new Error(`eWay login failed: ${loginData.Description ?? loginData.ReturnCode}`);
    }

    const sessionId = loginData.SessionId;
    const leadsData = await ewayPost("/GetLeads", { sessionId });

    if (leadsData.ReturnCode !== "rcSuccess") {
      throw new Error(`GetLeads failed: ${leadsData.Description ?? leadsData.ReturnCode}`);
    }

    const leads = leadsData.Data ?? [];
    const { data: companies } = await supabase.from("companies").select("id, short_name");
    const lvifId = companies?.find((c) => c.short_name === "LVIF")?.id ?? null;

    const rows = leads.map((lead) => ({
      eway_id:          lead.ItemGUID ?? String(lead.ItemID ?? ""),
      title:            lead.FileAs ?? lead.Subject ?? "Sans titre",
      client_name:      lead.ContactName ?? lead.CompanyName ?? null,
      amount:           lead.Amount != null ? Number(lead.Amount) : null,
      status:           mapStage(lead.LeadStatusEn ?? lead.StageName),
      next_action:      lead.NextTask ?? lead.LastNote ?? null,
      next_action_date: lead.NextTaskDate ?? null,
      company_id:       lvifId,
      synced_at:        new Date().toISOString(),
    })).filter((r) => r.eway_id);

    const { error, count } = await supabase.from("deals").upsert(rows, { onConflict: "eway_id", count: "exact" });
    if (error) throw error;

    await ewayPost("/LogOut", { sessionId }).catch(() => {});

    return NextResponse.json({ success: true, synced: count, total: leads.length, timestamp: new Date().toISOString() });

  } catch (err) {
    console.error("[sync/eway]", err);
    return NextResponse.json({ error: "Sync failed", detail: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}