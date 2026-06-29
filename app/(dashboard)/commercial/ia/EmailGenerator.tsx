"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";

const LIME = "#C5F73A";

const EMAIL_TYPES = [
  { value: "premier_contact",  label: "Premier contact",        emoji: "👋", desc: "Première approche d'un prospect" },
  { value: "suivi_devis",      label: "Suivi de devis",         emoji: "📋", desc: "Relancer après envoi d'un devis" },
  { value: "relance",          label: "Relance sans réponse",   emoji: "🔔", desc: "Prospect silencieux depuis +7 jours" },
  { value: "proposition",      label: "Proposition commerciale",emoji: "💼", desc: "Synthèse offre + prix + délais" },
  { value: "remerciement_rdv", label: "Remerciement post-RDV",  emoji: "🤝", desc: "Après un meeting, résumé + next steps" },
];

type Deal = {
  id: string;
  title: string;
  client_name: string | null;
  amount: number | null;
  status: string;
  next_action: string | null;
};

type Props = {
  deals: Deal[];
};

const STATUS_LABELS: Record<string, string> = {
  prospect:      "Prospect",
  qualification: "Qualification",
  proposition:   "Proposition",
  negociation:   "Négociation",
  gagne:         "Gagné",
  perdu:         "Perdu",
};

export function EmailGenerator({ deals }: Props) {
  const [selectedDealId, setSelectedDealId] = useState<string>("");
  const [emailType, setEmailType]           = useState<string>("");
  const [instructions, setInstructions]     = useState<string>("");
  const [loading, setLoading]               = useState(false);
  const [result, setResult]                 = useState<string>("");
  const [error, setError]                   = useState<string>("");
  const [copied, setCopied]                 = useState(false);

  const selectedDeal = deals.find((d) => d.id === selectedDealId) ?? null;

  async function handleGenerate() {
    if (!selectedDeal || !emailType) return;
    setLoading(true);
    setResult("");
    setError("");
    setCopied(false);

    try {
      const res = await fetch("/api/ia/commercial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deal_title:   selectedDeal.title,
          client_name:  selectedDeal.client_name,
          amount:       selectedDeal.amount,
          status:       selectedDeal.status,
          next_action:  selectedDeal.next_action,
          email_type:   emailType,
          instructions: instructions.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `Erreur ${res.status}`);
      } else {
        setResult(data.email ?? "");
      }
    } catch {
      setError("Impossible de joindre l'API — vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const canGenerate = selectedDealId && emailType && !loading;

  const card = {
    background: "linear-gradient(160deg,#1b1b1d,#141416)",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: 20,
    padding: "22px 24px",
  } as const;

  const labelStyle = {
    display: "block", color: "#6b6b70", fontSize: 11, fontWeight: 600 as const,
    textTransform: "uppercase" as const, letterSpacing: 0.8, marginBottom: 8,
  };

  const selectStyle = {
    width: "100%", background: "#111113", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12, padding: "11px 14px", color: "#f3f3f4", fontSize: 13,
    outline: "none", cursor: "pointer", appearance: "none" as const,
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 20, alignItems: "start" }}>

      {/* ── Panneau gauche : Formulaire ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Sélection du deal */}
        <div style={card}>
          <label style={labelStyle}>Deal ciblé</label>
          <select
            value={selectedDealId}
            onChange={(e) => setSelectedDealId(e.target.value)}
            style={selectStyle}
          >
            <option value="">Choisir un deal…</option>
            {deals
              .filter((d) => !["gagne","perdu"].includes(d.status))
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}{d.client_name ? ` — ${d.client_name}` : ""}
                </option>
              ))
            }
          </select>

          {selectedDeal && (
            <div style={{
              marginTop: 12, padding: "12px 14px", borderRadius: 12,
              background: "rgba(197,247,58,0.06)", border: "1px solid rgba(197,247,58,0.15)",
              display: "flex", flexDirection: "column", gap: 5,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#a3a3a8", fontSize: 12 }}>
                  {STATUS_LABELS[selectedDeal.status] ?? selectedDeal.status}
                </span>
                {selectedDeal.amount && (
                  <span style={{ color: LIME, fontSize: 12, fontWeight: 700 }}>
                    {formatCurrency(selectedDeal.amount)}
                  </span>
                )}
              </div>
              {selectedDeal.next_action && (
                <p style={{ color: "#6b6b70", fontSize: 11, marginTop: 2 }}>
                  → {selectedDeal.next_action}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Type d'email */}
        <div style={card}>
          <label style={labelStyle}>Type d'email</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {EMAIL_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setEmailType(t.value)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px", borderRadius: 12, cursor: "pointer",
                  border: emailType === t.value
                    ? `1px solid rgba(197,247,58,0.4)`
                    : "1px solid rgba(255,255,255,0.06)",
                  background: emailType === t.value
                    ? "rgba(197,247,58,0.08)"
                    : "rgba(255,255,255,0.02)",
                  textAlign: "left",
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 16, flexShrink: 0 }}>{t.emoji}</span>
                <div>
                  <p style={{
                    color: emailType === t.value ? LIME : "#e9e9ea",
                    fontSize: 12, fontWeight: 600,
                  }}>{t.label}</p>
                  <p style={{ color: "#6b6b70", fontSize: 11, marginTop: 1 }}>{t.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Instructions libres */}
        <div style={card}>
          <label style={labelStyle}>Consignes supplémentaires (optionnel)</label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Ex: mentionner notre offre de démonstration gratuite, mettre en avant le délai 48h de déploiement…"
            rows={3}
            style={{
              ...selectStyle,
              resize: "vertical" as const, lineHeight: 1.5,
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* Bouton générer */}
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          style={{
            width: "100%", padding: "14px 20px", borderRadius: 14,
            background: canGenerate ? LIME : "rgba(197,247,58,0.15)",
            color: canGenerate ? "#0c0c0d" : "#4b4b50",
            fontSize: 14, fontWeight: 700, border: "none", cursor: canGenerate ? "pointer" : "not-allowed",
            transition: "all 0.15s",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          {loading ? (
            <>
              <span style={{
                width: 14, height: 14, borderRadius: "50%",
                border: "2px solid rgba(12,12,13,0.3)",
                borderTopColor: "#0c0c0d",
                animation: "spin 0.7s linear infinite",
                display: "inline-block",
              }} />
              Génération en cours…
            </>
          ) : (
            <>✦ Générer l'email</>
          )}
        </button>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>

      {/* ── Panneau droit : Résultat ── */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <p style={{ color: "#e9e9ea", fontSize: 14, fontWeight: 700 }}>Email généré</p>
          {result && (
            <button
              onClick={handleCopy}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 14px", borderRadius: 20,
                background: copied ? "rgba(197,247,58,0.2)" : "rgba(255,255,255,0.06)",
                border: copied ? "1px solid rgba(197,247,58,0.4)" : "1px solid rgba(255,255,255,0.08)",
                color: copied ? LIME : "#a3a3a8",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {copied ? "✓ Copié !" : "Copier"}
            </button>
          )}
        </div>

        {error && (
          <div style={{
            padding: "14px 16px", borderRadius: 12,
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
            color: "#fca5a5", fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {!result && !error && !loading && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            minHeight: 400, textAlign: "center", gap: 12,
          }}>
            <div style={{ fontSize: 40, opacity: 0.4 }}>✦</div>
            <p style={{ color: "#6b6b70", fontSize: 14, fontWeight: 600 }}>
              Sélectionne un deal et un type d'email
            </p>
            <p style={{ color: "#4b4b50", fontSize: 12 }}>
              L'IA va générer un email dans le style de Maxime, adapté au contexte du deal.
            </p>
          </div>
        )}

        {loading && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            minHeight: 400, textAlign: "center", gap: 14,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              border: "3px solid rgba(197,247,58,0.2)",
              borderTopColor: LIME,
              animation: "spin 0.7s linear infinite",
            }} />
            <p style={{ color: "#6b6b70", fontSize: 13 }}>Claude rédige l'email…</p>
          </div>
        )}

        {result && !loading && (
          <div style={{
            background: "#0e0e10", borderRadius: 12, padding: "18px 20px",
            minHeight: 400, fontFamily: "ui-monospace, 'SF Mono', monospace",
            fontSize: 13, lineHeight: 1.7, color: "#d4d4d8",
            whiteSpace: "pre-wrap", wordBreak: "break-word" as const,
            border: "1px solid rgba(255,255,255,0.04)",
          }}>
            {result}
          </div>
        )}
      </div>
    </div>
  );
}
