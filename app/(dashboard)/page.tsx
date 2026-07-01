"use client";

// LVIF Group — Cockpit de synthèse (refactorisé selon brief client)
// 9 positions : KPIs 1-8 + graphique CA (KPI 9)
// Mobile-first responsive

import React, { useState, useEffect } from "react";

const LIME   = "#C5F73A";
const BG     = "#0c0c0d";
const CARD   = "linear-gradient(160deg,#1b1b1d,#141416)";
const BORDER = "1px solid rgba(255,255,255,0.05)";

// ─── Responsive hook ────────────────────────────────────────────────────────
function useBreakpoint() {
  const [bp, setBp] = useState<"mobile" | "tablet" | "desktop">("desktop");
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setBp(w < 640 ? "mobile" : w < 1024 ? "tablet" : "desktop");
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return bp;
}

// ─── Primitives ─────────────────────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  background: CARD,
  border: BORDER,
  borderRadius: 20,
  padding: "18px 20px",
};

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ color: "#6b6b70", fontSize: 11, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase" }}>
      {children}
    </span>
  );
}

function BigValue({ children, color = "#f3f3f4" }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{ margin: "10px 0 4px", color, fontSize: 26, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1 }}>
      {children}
    </div>
  );
}

function Sub({ children, color = "#9a9a9e" }: { children: React.ReactNode; color?: string }) {
  return <div style={{ color, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{children}</div>;
}

function TrendTag({ up, children }: { up?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
      <span style={{ fontSize: 13, color: up ? LIME : "#ff6b6b" }}>{up ? "↑" : "↓"}</span>
      <span style={{ color: "#6b6b70", fontSize: 11 }}>{children}</span>
    </div>
  );
}

function RetardBadge({ label }: { label: string }) {
  return (
    <span style={{
      background: "rgba(255,107,107,0.12)", color: "#ff9b9b",
      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

// ─── KPI 1: CA réalisé YTD ─────────────────────────────────────────────────
function Kpi1() {
  return (
    <div style={cardStyle}>
      <Label>CA réalisé YTD</Label>
      <BigValue>1 345 838 €</BigValue>
      <Sub color={LIME}>+1,91 mois vs n-1</Sub>
      <TrendTag up>+64,8% vs N-1 réalisé</TrendTag>
    </div>
  );
}

// ─── KPI 2: Avance CA facturé (laisse) ────────────────────────────────────
function Kpi2() {
  return (
    <div style={cardStyle}>
      <Label>Avance CA facturé</Label>
      <BigValue color={LIME}>+1,93 mois</BigValue>
      <Sub color={LIME}>vs même période N-1</Sub>
      <TrendTag up>En avance sur le réalisé</TrendTag>
    </div>
  );
}

// ─── KPI 3: Avance CA signé (laisse + dont en retard) ─────────────────────
function Kpi3() {
  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <Label>Avance CA signé</Label>
        <RetardBadge label="dont 18 255 € en retard" />
      </div>
      <BigValue color={LIME}>+3,80 mois</BigValue>
      <Sub color={LIME}>Pipeline signé fort</Sub>
      <TrendTag up>Incluant encaissements à venir</TrendTag>
    </div>
  );
}

// ─── KPI 4: CA signé YTD ──────────────────────────────────────────────────
function Kpi4() {
  return (
    <div style={cardStyle}>
      <Label>CA signé YTD</Label>
      <BigValue>1 624 273 €</BigValue>
      <Sub color={LIME}>+3,1 mois vs n-1</Sub>
      <TrendTag up>Facturé + signé 2026</TrendTag>
    </div>
  );
}

// ─── KPI 5: Total à encaisser ──────────────────────────────────────────────
function Kpi5() {
  return (
    <div style={cardStyle}>
      <Label>Total à encaisser</Label>
      <BigValue>803 304 €</BigValue>
      <Sub>Restant à recevoir 2026</Sub>
      <TrendTag up>CA réalisé + signé restant</TrendTag>
    </div>
  );
}

// ─── KPI 6: Charges fixes/mois ─────────────────────────────────────────────
function Kpi6() {
  return (
    <div style={cardStyle}>
      <Label>Charges fixes/mois</Label>
      <BigValue>25 577 €</BigValue>
      <Sub>Dép. struct. 14 507 + Prêts 11 070</Sub>
      <TrendTag up={false}>Coût structure mensuel</TrendTag>
    </div>
  );
}

// ─── KPI 7+8: Prêts bancaires + Endettement ───────────────────────────────
function Kpi7and8() {
  return (
    <div style={{ ...cardStyle, padding: 0, display: "flex", overflow: "hidden" }}>
      <div style={{ flex: 1, padding: "18px 16px", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
        <Label>Dont prêts bancaires/mois</Label>
        <BigValue>11 070 €</BigValue>
        <Sub>Remb. BNP mensuel</Sub>
        <div style={{ marginTop: 4, color: "#6b6b70", fontSize: 11 }}>43% des charges fixes</div>
      </div>
      <div style={{ flex: 1, padding: "18px 16px" }}>
        <Label>Endettement</Label>
        <BigValue color="#6b6b70">N/C</BigValue>
        <Sub>Données BNP hors API</Sub>
        <div style={{ marginTop: 4, color: "#4a4a50", fontSize: 11 }}>Relevé manuel requis</div>
      </div>
    </div>
  );
}

// ─── KPI 9: Graphique CA annuel ────────────────────────────────────────────
const CA_DATA = [
  { year: "2019", ca: 561607 },
  { year: "2020", ca: 614694 },
  { year: "2021", ca: 749349 },
  { year: "2022", ca: 1144624 },
  { year: "2023", ca: 1639939 },
  { year: "2024", ca: 1867231 },
  { year: "2025", ca: 2076384 },
  { year: "2026†", ca: 1624273, signed: true },
];

function CaChart() {
  const max = 2076384;
  const fmt = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M€` : `${Math.round(n / 1000)}k€`;

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ color: "#e9e9ea", fontSize: 15, fontWeight: 700, marginBottom: 3 }}>Évolution CA annuel</div>
          <Label>2019 → 2026 (CA signé)</Label>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span style={{
            background: "rgba(197,247,58,.12)", color: LIME,
            fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 30,
          }}>+270% depuis 2019</span>
          <span style={{
            background: "rgba(255,255,255,0.04)", color: "#6b6b70",
            fontSize: 10, fontWeight: 600, padding: "4px 10px", borderRadius: 30,
          }}>† 2026 = CA signé</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 130 }}>
        {CA_DATA.map((d) => {
          const h = Math.round((d.ca / max) * 90);
          const isSigned = "signed" in d && d.signed;
          return (
            <div key={d.year} style={{ flex: 1, minWidth: 36, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ color: isSigned ? LIME : "#5a5a60", fontSize: 9, fontWeight: 700, textAlign: "center" }}>
                {fmt(d.ca)}
              </span>
              <div style={{
                width: "100%", height: h,
                borderRadius: "5px 5px 3px 3px",
                background: isSigned
                  ? "linear-gradient(180deg,#C5F73A,#9bd219)"
                  : "rgba(255,255,255,0.08)",
                boxShadow: isSigned ? "0 0 18px rgba(197,247,58,.35)" : "none",
              }} />
              <span style={{ color: isSigned ? LIME : "#5a5a60", fontSize: 10, fontWeight: 600, textAlign: "center" }}>
                {d.year}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 12, color: "#4a4a50", fontSize: 10 }}>
        † 2026 = CA signé au 27 juin 2026 : facturé 1 345 838 € + pipeline signé 278 435 €. Avancement année : 48,77%.
      </div>
    </div>
  );
}

// ─── PAGE ────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const bp = useBreakpoint();
  const isMobile = bp === "mobile";
  const isTablet = bp === "tablet";

  // 4 cols → 2 cols tablet/mobile
  const grid4 = isMobile ? "1fr 1fr" : isTablet ? "1fr 1fr" : "1fr 1fr 1fr 1fr";
  // 3 cols → 1 col
  const grid3 = isMobile ? "1fr" : isTablet ? "1fr 1fr" : "1fr 1fr 1fr";
  const px = isMobile ? 14 : 24;

  function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, marginTop: 20 }}>
        <span style={{ width: 3, height: 14, borderRadius: 2, background: LIME, display: "inline-block" }} />
        <span style={{ color: "#e9e9ea", fontSize: 13, fontWeight: 700 }}>{children}</span>
      </div>
    );
  }

  return (
    <div style={{ background: BG, minHeight: "100vh", padding: `${isMobile ? 16 : 24}px ${px}px 32px`, fontFamily: "Manrope, sans-serif" }}>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 12 }}>
        <div>
          <div style={{ color: "#f3f3f4", fontSize: isMobile ? 18 : 22, fontWeight: 800, letterSpacing: -0.5 }}>
            Cockpit LVIF Group
          </div>
          <div style={{ color: "#6b6b70", fontSize: 11, marginTop: 3 }}>
            {isMobile ? "TRESO Avr 2026 · eWay" : "Sources : TRESO Avril 2026 · Fichier Suivi Maître · eWay CRM"}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{
            background: "rgba(197,247,58,.1)", border: "1px solid rgba(197,247,58,.2)",
            borderRadius: 30, padding: "5px 12px",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: LIME, boxShadow: `0 0 6px ${LIME}`, display: "inline-block", flexShrink: 0 }} />
            <span style={{ color: LIME, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
              {isMobile ? "27 juin 2026" : "MàJ : 27 juin 2026"}
            </span>
          </div>
          {!isMobile && (
            <div style={{
              width: 38, height: 38, borderRadius: "50%",
              background: "linear-gradient(135deg,#3a3a3a,#1f1f1f)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: LIME, fontWeight: 800, fontSize: 14, border: BORDER,
            }}>L</div>
          )}
        </div>
      </div>

      {/* ROW 1 — KPIs 1–4 */}
      <SectionTitle>CA &amp; Pipeline</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: grid4, gap: 12 }}>
        <Kpi1 />
        <Kpi2 />
        <Kpi3 />
        <Kpi4 />
      </div>

      {/* ROW 2 — KPIs 5–8 */}
      <SectionTitle>Structure financière</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: grid3, gap: 12 }}>
        <Kpi5 />
        <Kpi6 />
        <Kpi7and8 />
      </div>

      {/* KPI 9 — Graphique CA */}
      <SectionTitle>Historique CA</SectionTitle>
      <CaChart />

      {/* Footer */}
      <div style={{ marginTop: 24, padding: "12px 16px", background: "rgba(255,255,255,0.02)", borderRadius: 14, border: BORDER }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <span style={{ color: "#4a4a50", fontSize: 10 }}>
            <strong style={{ color: "#6b6b70" }}>Sources :</strong> TRESO AVRIL 2026 V 16-05 · Fichier Suivi Maître DEF · eWay CRM (110 deals)
          </span>
          {!isMobile && (
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { label: "Commercial", href: "/commercial" },
                { label: "Finance",    href: "/finance" },
                { label: "Immobilier", href: "/immobilier" },
              ].map((l) => (
                <a key={l.href} href={l.href} style={{
                  color: "#6b6b70", fontSize: 11, fontWeight: 600,
                  textDecoration: "none", padding: "3px 10px",
                  background: "rgba(255,255,255,0.04)", borderRadius: 20,
                }}>{l.label}</a>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
