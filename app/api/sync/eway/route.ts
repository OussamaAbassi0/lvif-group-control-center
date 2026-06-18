/**
 * POST /api/sync/eway
 * Synchronisation eWay CRM → Supabase
 * Appelé par n8n (cron toutes les 15 min)
 * Sécurisé par CRON_SECRET header
 */

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(request: Request) {
  // Vérification du secret cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Client service role (bypass RLS pour les syncs)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. Récupérer les deals depuis eWay CRM
    const ewayResponse = await fetch(
      `${process.env.EWAY_INSTANCE_URL}/api/v3/deals?fields=id,name,contact,amount,stage,owner,nextActionDate,nextAction`,
      {
        headers: {
          Authorization: `Bearer ${process.env.EWAY_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!ewayResponse.ok) {
      throw new Error(`eWay API error: ${ewayResponse.status}`);
    }

    const ewayData = await ewayResponse.json();
    const deals = ewayData.data || [];

    // 2. Upsert dans Supabase
    const upsertData = deals.map((deal: Record<string, unknown>) => ({
      eway_id: String(deal.id),
      title: deal.name || "Sans titre",
      client_name: (deal.contact as { name?: string })?.name || null,
      amount: deal.amount ? Number(deal.amount) : null,
      status: mapEwayStage(String(deal.stage || "")),
      next_action: deal.nextAction || null,
      next_action_date: deal.nextActionDate || null,
      synced_at: new Date().toISOString(),
    }));

    const { error, count } = await supabase
      .from("deals")
      .upsert(upsertData, {
        onConflict: "eway_id",
        count: "exact",
      });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      synced: count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[sync/eway] Error:", error);
    return NextResponse.json(
      {
        error: "Sync failed",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Mapping des statuts eWay → notre enum
function mapEwayStage(stage: string): string {
  const map: Record<string, string> = {
    Lead:          "prospect",
    Prospect:      "prospect",
    Qualification: "qualification",
    Proposal:      "proposition",
    Negotiation:   "negociation",
    Won:           "gagne",
    Lost:          "perdu",
    Closed:        "gagne",
  };
  return map[stage] || "prospect";
}
