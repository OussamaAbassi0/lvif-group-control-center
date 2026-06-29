/**
 * POST /api/sync/eway
 * Synchronisation eWay CRM (WCF API) → Supabase
 * Sécurisé par CRON_SECRET header
 *
 * eWay CRM utilise une API WCF :
 *   Base URL : https://hosting.eway-crm.com/sas_lvif/API.svc
 *   Auth     : POST /LogIn avec userName + passwordHash (MD5)
 *   Leads    = "Deals" dans l'interface eWay
 *
 * close_date : date à laquelle le deal est passé en "gagne"
 *   - Préservée si déjà définie (ne jamais écraser une date de signature passée)
 *   - Définie à aujourd'hui lors du premier passage en status "gagne"
 */

import { createClient } from "@supabase/supabase-js";
import { NextResponse }  from "next/server";
import { createHash }    from "crypto";

export const runtime = "nodejs";

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
  "":               "prospect",
  "New":            "prospect",
  "Qualification":  "qualification",
  "Proposal":       "proposition",
  "Negotiation":    "negociation",
  "Won":            "gagne",
  "Closed Won":     "gagne",
  "Lost":           "perdu",
  "Closed Lost":    "perdu",
  "Closed":         "gagne",
};

function mapStage(stage: string | null | undefined) {
  if (!stage) return "prospect";
  const trimmed = stage.trim();
  if (trimmed in STAGE_MAP) return STAGE_MAP[trimmed];
  // Fallback: recherche partielle insensible à la casse
  for (const [k, v] of Object.entries(STAGE_MAP)) {
    if (k && trimmed.toLowerCase().includes(k.toLowerCase())) return v;
  }
  return "prospect";
}

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  try {
    // 1. Login eWay
    const loginData = await ewayPost("/LogIn", {
      userName:                process.env.EWAY_USERNAME!,
      passwordHash:            md5(process.env.EWAY_PASSWORD!),
      appVersion:              "LVIF Dashboard 1.0.0",
      clientMachineIdentifier: "lvif-control-center",
      clientMachineName:       "LVIF-CONTROL-CENTER",
      databaseVersion:         0,
    });

    if (loginData.ReturnCode !== "rcSuccess") {
      throw new Error(`eWay login failed: ${loginData.Description ?? loginData.ReturnCode}`);
    }

    const sessionId = loginData.SessionId;

    // 2. Récupérer les leads eWay
    const leadsData = await ewayPost("/GetLeads", { sessionId });

    if (leadsData.ReturnCode !== "rcSuccess") {
      throw new Error(`GetLeads failed: ${leadsData.Description ?? leadsData.ReturnCode}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const leads: any[] = leadsData.Data ?? [];

    // 3. Récupérer les close_dates existantes pour NE PAS les écraser
    // (une date de signature passée ne doit jamais être remplacée par "aujourd'hui")
    const { data: existingWon } = await supabase
      .from("deals")
      .select("eway_id, close_date")
      .not("close_date", "is", null);

    const existingCloseDates = new Map<string, string>(
      existingWon?.map((d) => [d.eway_id as string, d.close_date as string]) ?? []
    );

    // 4. Résoudre la company LVIF
    const { data: companies } = await supabase.from("companies").select("id, short_name");
    const lvifId = companies?.find((c) => c.short_name === "LVIF")?.id ?? null;

    const today = new Date().toISOString().split("T")[0];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = leads.map((lead: any) => {
      const ewayId = lead.ItemGUID ?? String(lead.ItemID ?? "");
      const status = mapStage(
        lead.LeadStatusEn ?? lead.StageName ?? lead.LeadStatus ?? lead.Status
      );

      // close_date : préserver si existe, sinon définir aujourd'hui lors du premier passage en "gagne"
      let closeDate: string | null = null;
      if (status === "gagne") {
        closeDate = existingCloseDates.get(ewayId) ?? today;
      }

      return {
        eway_id:          ewayId,
        title:            lead.FileAs ?? lead.Subject ?? lead.Name ?? "Sans titre",
        client_name:      lead.ContactName ?? lead.CompanyName ?? lead.AccountName ?? null,
        amount:           lead.Amount != null ? Number(lead.Amount) : null,
        status,
        next_action:      lead.NextTask ?? lead.LastNote ?? lead.Note ?? null,
        next_action_date: lead.NextTaskDate ?? lead.DueDate ?? null,
        close_date:       closeDate,
        company_id:       lvifId,
        synced_at:        new Date().toISOString(),
      };
    }).filter((r) => r.eway_id);

    // 5. Upsert Supabase
    const { error, count } = await supabase
      .from("deals")
      .upsert(rows, { onConflict: "eway_id", count: "exact" });

    if (error) throw error;

    // 6. Logout eWay (best effort)
    await ewayPost("/LogOut", { sessionId }).catch(() => {});

    return NextResponse.json({
      success:   true,
      synced:    count,
      total:     leads.length,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error("[sync/eway]", err);
    return NextResponse.json(
      { error: "Sync failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
