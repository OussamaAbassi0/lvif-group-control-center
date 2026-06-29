import { createClient } from "@/lib/supabase/server";
import { EmailGenerator } from "./EmailGenerator";

const LIME = "#C5F73A";

export default async function IACommercialePage() {
  const supabase = await createClient();

  const { data: deals } = await supabase
    .from("deals")
    .select("id, title, client_name, amount, status, next_action")
    .not("status", "in", '("perdu")')
    .order("priority", { ascending: false })
    .order("next_action_date", { ascending: true });

  const safeDeals = (deals ?? []).map((d) => ({
    id:          d.id,
    title:       d.title,
    client_name: d.client_name,
    amount:      d.amount,
    status:      d.status,
    next_action: d.next_action,
  }));

  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

  return (
    <div style={{ padding: "28px 24px", background: "#0c0c0d", minHeight: "100vh" }}>

      {/* ── En-tête ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <p style={{ color: "#6b6b70", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
            LVIF Group — Phase 2
          </p>
          <span style={{
            background: "rgba(197,247,58,0.15)", color: LIME, fontSize: 10, fontWeight: 700,
            padding: "2px 8px", borderRadius: 20, border: "1px solid rgba(197,247,58,0.3)",
            letterSpacing: 0.5,
          }}>NOUVEAU</span>
        </div>
        <h1 style={{ color: "#f3f3f4", fontSize: 26, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1 }}>
          IA Commerciale
        </h1>
        <p style={{ color: "#6b6b70", fontSize: 13, marginTop: 6 }}>
          Génère des emails commerciaux dans le style de Maxime — en 5 secondes.
        </p>
      </div>

      {/* ── Alerte si clé API manquante ── */}
      {!hasApiKey && (
        <div style={{
          marginBottom: 24, padding: "16px 20px", borderRadius: 14,
          background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)",
          display: "flex", alignItems: "flex-start", gap: 12,
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
          <div>
            <p style={{ color: "#fbbf24", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
              Clé API Anthropic manquante
            </p>
            <p style={{ color: "#a3a3a8", fontSize: 12, lineHeight: 1.5 }}>
              Ajoute <code style={{ background:"rgba(255,255,255,0.1)", padding:"1px 6px", borderRadius:4 }}>ANTHROPIC_API_KEY</code> dans les variables d'environnement Vercel pour activer la génération.
              Obtiens ta clé sur <strong>console.anthropic.com</strong>.
            </p>
          </div>
        </div>
      )}

      {/* ── Stats rapides ── */}
      <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Deals actifs disponibles", value: safeDeals.filter(d => !["gagne","perdu"].includes(d.status)).length },
          { label: "Modèle",                   value: "Claude Haiku 4.5" },
          { label: "Temps moyen",              value: "< 5 sec" },
          { label: "Langues",                  value: "Français" },
        ].map((s) => (
          <div key={s.label} style={{
            background: "linear-gradient(160deg,#1b1b1d,#141416)",
            border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14,
            padding: "12px 18px",
          }}>
            <p style={{ color: "#6b6b70", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 4 }}>
              {s.label}
            </p>
            <p style={{ color: LIME, fontSize: 14, fontWeight: 700 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Générateur ── */}
      <EmailGenerator deals={safeDeals} />
    </div>
  );
}
