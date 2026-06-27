"use client";

// LVIF Group — Cockpit de synthèse des sources
// Sources : TRESO AVRIL 2026 V 16-05 + FICHIER SUIVI MAITRE DEF
// Thème   : bg #0c0c0d, cards #1b1b1d→#141416, accent #C5F73A, font Manrope

import React from "react";

const LIME = "#C5F73A";
const BG   = "#0c0c0d";
const CARD = "linear-gradient(160deg,#1b1b1d,#141416)";

// ─── primitives ─────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: CARD,
  border: "1px solid rgba(255,255,255,0.05)",
  borderRadius: 20,
  padding: "18px 20px",
};

function Label({ children }: { children: React.ReactNode }) {
  return <span style={{ color:"#6b6b70", fontSize:11, fontWeight:600, letterSpacing:.4, textTransform:"uppercase" }}>{children}</span>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, margin:"28px 0 12px" }}>
      <span style={{ width:3, height:16, borderRadius:2, background:LIME, display:"inline-block" }} />
      <span style={{ color:"#e9e9ea", fontSize:14, fontWeight:700 }}>{children}</span>
    </div>
  );
}

function Badge({ children, color="#2a2a2d" }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center",
      background:color, borderRadius:30,
      padding:"3px 10px", fontSize:11, fontWeight:700,
    }}>{children}</span>
  );
}

// ─── SECTION 1 — KPIs Trésorerie ────────────────────────────────────────────

const KPI_DATA = [
  {
    label: "CA réalisé YTD 2026",
    value: "1 345 838 €",
    sub: "Avancement : 48,77% de l'année",
    subColor: LIME,
    trend: "+64,8% vs N-1 réalisé",
    trendUp: true,
  },
  {
    label: "Avance CA facturé",
    value: "+1,93 mois",
    sub: "vs même période N-1",
    subColor: LIME,
    trend: "En avance sur le réalisé",
    trendUp: true,
  },
  {
    label: "Avance CA signé",
    value: "+3,80 mois",
    sub: "Pipeline signé fort",
    subColor: LIME,
    trend: "Incluant encaissements à venir",
    trendUp: true,
  },
  {
    label: "Total à recevoir 2026",
    value: "803 304 €",
    sub: "Facturé + signé : 1 624 273 €",
    subColor: "#9a9a9e",
    trend: "Restant à encaisser 2026",
    trendUp: true,
  },
];

function KpiCard({ label, value, sub, subColor, trend, trendUp }: typeof KPI_DATA[0]) {
  return (
    <div style={{ ...card }}>
      <Label>{label}</Label>
      <div style={{ margin:"10px 0 4px", color:"#f3f3f4", fontSize:26, fontWeight:800, letterSpacing:-.5, lineHeight:1 }}>
        {value}
      </div>
      <div style={{ color:subColor, fontSize:12, fontWeight:600, marginBottom:8 }}>{sub}</div>
      <div style={{ display:"flex", alignItems:"center", gap:5 }}>
        <span style={{ fontSize:13, color: trendUp ? LIME : "#ff6b6b" }}>{trendUp ? "↑" : "↓"}</span>
        <span style={{ color:"#6b6b70", fontSize:11 }}>{trend}</span>
      </div>
    </div>
  );
}

// ─── SECTION 2 — Évolution CA ───────────────────────────────────────────────

const CA_HISTORY = [
  { year: "2019", ca: 561607 },
  { year: "2020", ca: 614694 },
  { year: "2021", ca: 749349 },
  { year: "2022", ca: 1144624 },
  { year: "2023", ca: 1639939 },
  { year: "2024", ca: 1867231 },
  { year: "2025", ca: 2076384 },
  { year: "2026*", ca: 1345838, ytd: true },
];

function EvolutionCA() {
  const max = 2076384;
  const fmt = (n: number) =>
    n >= 1_000_000
      ? `${(n / 1_000_000).toFixed(2)}M€`
      : `${Math.round(n / 1000)}k€`;

  return (
    <div style={{ ...card }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
        <div>
          <div style={{ color:"#e9e9ea", fontSize:14, fontWeight:700, marginBottom:2 }}>Évolution CA annuel</div>
          <Label>2019 → 2026 YTD</Label>
        </div>
        <span style={{
          background:"rgba(197,247,58,.12)", color:LIME,
          fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:30,
        }}>+270% depuis 2019</span>
      </div>
      <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:120 }}>
        {CA_HISTORY.map((d) => {
          const h = Math.round((d.ca / max) * 100);
          return (
            <div key={d.year} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
              <span style={{ color: d.ytd ? LIME : "#5a5a60", fontSize:9, fontWeight:700 }}>
                {fmt(d.ca)}
              </span>
              <div style={{
                width:"100%", height:`${h}%`,
                borderRadius:"5px 5px 3px 3px",
                background: d.ytd
                  ? "linear-gradient(180deg,#C5F73A,#9bd219)"
                  : "rgba(255,255,255,0.08)",
                boxShadow: d.ytd ? "0 0 18px rgba(197,247,58,.35)" : "none",
                transition:"all .3s",
              }} />
              <span style={{ color: d.ytd ? LIME : "#5a5a60", fontSize:10, fontWeight:600 }}>{d.year}</span>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop:12, color:"#5a5a60", fontSize:10 }}>* 2026 = YTD au 27 juin 2026 (48,77% de l'année écoulée)</div>
    </div>
  );
}

function DecathlonRisk() {
  const data = [
    { label:"Decathlon 2024", value:851832, pct:46, total:1867231 },
    { label:"Decathlon 2025", value:1371339, pct:66, total:2076384 },
    { label:"Decathlon 2026", value:517455, pct:38, total:1345838 },
  ];
  const restantEncaisser = [
    { label:"Restant 2024", value:"16 055 €", color:"#5a5a60" },
    { label:"Restant 2025", value:"2 200 €",  color:"#5a5a60" },
    { label:"Restant 2026", value:"478 739 €", color:LIME },
  ];
  return (
    <div style={{ ...card }}>
      <div style={{ color:"#e9e9ea", fontSize:14, fontWeight:700, marginBottom:4 }}>Dépendance Decathlon</div>
      <Label>% du CA total facturé</Label>
      <div style={{ marginTop:14, display:"flex", flexDirection:"column", gap:10 }}>
        {data.map((d) => (
          <div key={d.label}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
              <span style={{ color:"#9a9a9e", fontSize:12, fontWeight:600 }}>{d.label}</span>
              <span style={{ color: d.pct > 60 ? "#ff9b5e" : d.pct > 45 ? "#ffd166" : LIME, fontSize:12, fontWeight:700 }}>
                {d.pct}% — {Math.round(d.value/1000)}k€
              </span>
            </div>
            <div style={{ height:6, borderRadius:4, background:"rgba(255,255,255,0.07)", overflow:"hidden" }}>
              <div style={{
                width:`${d.pct}%`, height:"100%", borderRadius:4,
                background: d.pct > 60 ? "#ff9b5e" : d.pct > 45 ? "#ffd166" : LIME,
              }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ height:1, background:"rgba(255,255,255,0.06)", margin:"16px 0" }} />
      <div style={{ color:"#e9e9ea", fontSize:12, fontWeight:700, marginBottom:8 }}>Restant à encaisser</div>
      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
        {restantEncaisser.map((r) => (
          <div key={r.label} style={{ display:"flex", justifyContent:"space-between" }}>
            <span style={{ color:"#6b6b70", fontSize:11 }}>{r.label}</span>
            <span style={{ color:r.color, fontSize:12, fontWeight:700 }}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SECTION 3 — Opérations J+15 ────────────────────────────────────────────

type Urgency = "now" | "soon" | "ok";

const EVENTS_15J = [
  { nom:"Bouygues", lieu:"IDF", montage:"29/06", demontage:"30/06", jours:2, urgency:"now" as Urgency },
  { nom:"Decathlon - WHOLESALE", lieu:"PROVINCE", montage:"02/07", demontage:"09/07", jours:5, urgency:"soon" as Urgency },
  { nom:"La Rotonde", lieu:"IDF", montage:"30/05", demontage:"20/07", jours:0, urgency:"now" as Urgency, enCours:true },
  { nom:"Ville de Ramatuelle", lieu:"PROVINCE", montage:"11/06", demontage:"20/07", jours:0, urgency:"ok" as Urgency, enCours:true },
];

const FIXES_15J = [
  { nom:"Magasin MOIDA Champs-Elysées", date:"30/06", jours:3, urgency:"now" as Urgency },
  { nom:"Ville de Roissy-en-France",     date:"11/07", jours:14, urgency:"soon" as Urgency },
  { nom:"UGC Ciné Cité Paris 19ème",     date:"15/07", jours:18, urgency:"ok" as Urgency },
  { nom:"UGC Ciné Cité Rosny",           date:"15/07", jours:18, urgency:"ok" as Urgency },
];

const SAV_ACTIF = [
  { client:"Mairie de Buzançais",    modele:"CRTOP P3.9",    probleme:"Borne tactile HS",        priorite:0, intervention:"NON" },
  { client:"Saipol",                 modele:"P3,9 / P4,8",   probleme:"Dalles à réparer",         priorite:0, intervention:"OUI" },
  { client:"Aéroport de Nice",       modele:"CRTOP P3.9",    probleme:"Écran noir",               priorite:0, intervention:"NON" },
  { client:"SAFT",                   modele:"CRTOP P3.9",    probleme:"Problème déploiement",     priorite:0, intervention:"NON" },
  { client:"France Styles",          modele:"P6,6",          probleme:"LEDs défectueuses",         priorite:0, intervention:"NON" },
  { client:"Steak'N'Shake",          modele:"CRTOP P3.9",    probleme:"Maintenance double-face",   priorite:0, intervention:"OUI" },
  { client:"Gendarmerie de Marseille", modele:"—",           probleme:"Capteurs infrarouge",       priorite:0, intervention:"NON" },
  { client:"Bar Belushi's",          modele:"QIANLED",       probleme:"Maintenance dernière face", priorite:0, intervention:"NON" },
  { client:"BoConcept",              modele:"EAGER P4.81",   probleme:"À planifier",               priorite:1, intervention:"NON" },
];

function urgencyColor(u: Urgency) {
  if (u === "now")  return "#ff6b6b";
  if (u === "soon") return "#ffd166";
  return LIME;
}

function urgencyLabel(u: Urgency, jours: number) {
  if (u === "now")  return jours <= 0 ? "En cours" : `J-${jours}`;
  if (u === "soon") return `J-${jours}`;
  return `J-${jours}`;
}

function EventsCard() {
  return (
    <div style={{ ...card }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <div>
          <div style={{ color:"#e9e9ea", fontSize:14, fontWeight:700 }}>Events · J+15</div>
          <Label>Source : Fichier Suivi Maître — EVENTS</Label>
        </div>
        <Badge color="rgba(197,247,58,.1)">
          <span style={{ color:LIME }}>{EVENTS_15J.length} actifs</span>
        </Badge>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {EVENTS_15J.map((e, i) => (
          <div key={i} style={{
            display:"flex", alignItems:"center", gap:10,
            background:"rgba(255,255,255,0.03)", borderRadius:12, padding:"10px 12px",
            borderLeft:`3px solid ${urgencyColor(e.urgency)}`,
          }}>
            <div style={{ flex:1 }}>
              <div style={{ color:"#e9e9ea", fontSize:13, fontWeight:700 }}>{e.nom}</div>
              <div style={{ color:"#6b6b70", fontSize:11, marginTop:2 }}>
                {e.lieu} · Montage {e.montage}{e.demontage ? ` → Démontage ${e.demontage}` : ""}
              </div>
            </div>
            <span style={{
              background:`${urgencyColor(e.urgency)}22`,
              color:urgencyColor(e.urgency),
              fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:30,
            }}>
              {e.enCours ? "En cours" : urgencyLabel(e.urgency, e.jours)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FixesCard() {
  return (
    <div style={{ ...card }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <div>
          <div style={{ color:"#e9e9ea", fontSize:14, fontWeight:700 }}>Installations · J+15</div>
          <Label>Source : Fichier Suivi Maître — FIXES</Label>
        </div>
        <Badge color="rgba(197,247,58,.1)">
          <span style={{ color:LIME }}>{FIXES_15J.length} chantiers</span>
        </Badge>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {FIXES_15J.map((f, i) => (
          <div key={i} style={{
            display:"flex", alignItems:"center", gap:10,
            background:"rgba(255,255,255,0.03)", borderRadius:12, padding:"10px 12px",
            borderLeft:`3px solid ${urgencyColor(f.urgency)}`,
          }}>
            <div style={{ flex:1 }}>
              <div style={{ color:"#e9e9ea", fontSize:13, fontWeight:700 }}>{f.nom}</div>
              <div style={{ color:"#6b6b70", fontSize:11, marginTop:2 }}>Installation prévue le {f.date}</div>
            </div>
            <span style={{
              background:`${urgencyColor(f.urgency)}22`,
              color:urgencyColor(f.urgency),
              fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:30,
            }}>
              {urgencyLabel(f.urgency, f.jours)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SavCard() {
  return (
    <div style={{ ...card }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <div>
          <div style={{ color:"#e9e9ea", fontSize:14, fontWeight:700 }}>SAV actif</div>
          <Label>Source : Fichier Suivi Maître — SAV</Label>
        </div>
        <Badge color="rgba(255,107,107,.12)">
          <span style={{ color:"#ff6b6b" }}>{SAV_ACTIF.length} tickets</span>
        </Badge>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
        {SAV_ACTIF.map((s, i) => (
          <div key={i} style={{
            display:"flex", alignItems:"center", gap:10,
            background:"rgba(255,255,255,0.03)", borderRadius:12, padding:"9px 12px",
            borderLeft:`3px solid ${s.intervention === "OUI" ? LIME : "rgba(255,107,107,.5)"}`,
          }}>
            <div style={{ flex:1 }}>
              <div style={{ color:"#e9e9ea", fontSize:12, fontWeight:700 }}>{s.client}</div>
              <div style={{ color:"#6b6b70", fontSize:10, marginTop:1 }}>{s.modele} · {s.probleme}</div>
            </div>
            <span style={{
              background: s.intervention === "OUI" ? "rgba(197,247,58,.12)" : "rgba(255,107,107,.12)",
              color: s.intervention === "OUI" ? LIME : "#ff9b9b",
              fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:30, whiteSpace:"nowrap",
            }}>
              {s.intervention === "OUI" ? "Planifié" : "À planifier"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SECTION 4 — Garanties ───────────────────────────────────────────────────

type GarantieStatus = "expired" | "critical" | "warning" | "ok";

const GARANTIES: { client:string; fin:string; moisRestants:number; garantie:string }[] = [
  { client:"Nice",               fin:"21/03/2026", moisRestants:-3,  garantie:"3 ans complet" },
  { client:"La Roche Posay",     fin:"03/03/2026", moisRestants:-4,  garantie:"3 ans complet" },
  { client:"Bo Concept",         fin:"16/02/2026", moisRestants:-4,  garantie:"3 ans complet" },
  { client:"Sorbone",            fin:"07/06/2026", moisRestants:0,   garantie:"3 ans simple" },
  { client:"Ceze discount",      fin:"02/06/2026", moisRestants:0,   garantie:"3 ans complet" },
  { client:"BPCE Lease",         fin:"11/07/2026", moisRestants:0.5, garantie:"3 ans complet" },
  { client:"MPCC",               fin:"11/07/2026", moisRestants:0.5, garantie:"3 ans complet" },
  { client:"ASR FOS et MONTOIR", fin:"09/08/2026", moisRestants:1.5, garantie:"3 ans complet" },
  { client:"Steak and shake",    fin:"28/09/2026", moisRestants:3,   garantie:"3 ans complet" },
  { client:"Union Bordeaux Begles", fin:"11/10/2026", moisRestants:3.5, garantie:"3 ans pièces" },
  { client:"Decathlon (32m2)",   fin:"27/01/2027", moisRestants:7,   garantie:"3 ans — Ecran P2,5" },
  { client:"Saint Gobain petit", fin:"19/01/2027", moisRestants:7,   garantie:"3 ans complet" },
  { client:"Decathlon Hall",     fin:"16/01/2027", moisRestants:7,   garantie:"3 ans pièces" },
  { client:"Mazak",              fin:"15/11/2027", moisRestants:17,  garantie:"3 ans complet" },
  { client:"Tishman Speyer",     fin:"06/02/2029", moisRestants:32,  garantie:"5 ans pièces" },
  { client:"Kipstadium",         fin:"31/01/2029", moisRestants:31,  garantie:"5 ans pièces" },
  { client:"Avancial SNCF",      fin:"02/08/2029", moisRestants:38,  garantie:"5 ans complet" },
  { client:"Gendarmerie Belfort", fin:"26/05/2028", moisRestants:23, garantie:"5 ans complet" },
  { client:"Gendarmerie Jura",   fin:"26/05/2028", moisRestants:23,  garantie:"5 ans complet" },
  { client:"Gendarmerie Marseille", fin:"02/12/2030", moisRestants:54, garantie:"5 ans complet" },
];

function garantieStatus(mois: number): GarantieStatus {
  if (mois < 0)   return "expired";
  if (mois <= 1)  return "critical";
  if (mois <= 4)  return "warning";
  return "ok";
}

function garantieColor(s: GarantieStatus) {
  if (s === "expired")  return "#ff6b6b";
  if (s === "critical") return "#ff9b5e";
  if (s === "warning")  return "#ffd166";
  return "#4ade80";
}

function garantieLabel(s: GarantieStatus, mois: number) {
  if (s === "expired")  return "Expirée";
  if (s === "critical") return `${Math.round(mois * 30)}j`;
  if (s === "warning")  return `${Math.round(mois)}m`;
  return `${Math.round(mois)}m`;
}

function GarantiesCard() {
  const sorted = [...GARANTIES].sort((a, b) => a.moisRestants - b.moisRestants);
  return (
    <div style={{ ...card }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <div>
          <div style={{ color:"#e9e9ea", fontSize:14, fontWeight:700 }}>Suivi Garanties Clients</div>
          <Label>Source : TRESO AVRIL 2026 — onglet Suivi Garantie</Label>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <Badge color="rgba(255,107,107,.12)"><span style={{ color:"#ff6b6b" }}>
            {sorted.filter(g => garantieStatus(g.moisRestants) === "expired").length} expirées
          </span></Badge>
          <Badge color="rgba(255,155,94,.12)"><span style={{ color:"#ff9b5e" }}>
            {sorted.filter(g => garantieStatus(g.moisRestants) === "critical").length} critiques
          </span></Badge>
        </div>
      </div>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead>
            <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
              {["Client","Garantie","Fin de garantie","Restant","Statut"].map(h => (
                <th key={h} style={{ textAlign:"left", padding:"6px 8px", color:"#6b6b70", fontWeight:600, fontSize:11, whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((g, i) => {
              const s = garantieStatus(g.moisRestants);
              const c = garantieColor(s);
              return (
                <tr key={i} style={{ borderBottom:"1px solid rgba(255,255,255,0.03)" }}>
                  <td style={{ padding:"8px 8px", color:"#e9e9ea", fontWeight:600 }}>{g.client}</td>
                  <td style={{ padding:"8px 8px", color:"#7d7d82" }}>{g.garantie}</td>
                  <td style={{ padding:"8px 8px", color:"#9a9a9e", whiteSpace:"nowrap" }}>{g.fin}</td>
                  <td style={{ padding:"8px 8px", whiteSpace:"nowrap" }}>
                    <div style={{ height:4, width:60, borderRadius:3, background:"rgba(255,255,255,0.07)", overflow:"hidden", marginBottom:3 }}>
                      <div style={{
                        width:`${Math.min(100, Math.max(0, (g.moisRestants / 60) * 100))}%`,
                        height:"100%", borderRadius:3, background:c,
                      }} />
                    </div>
                  </td>
                  <td style={{ padding:"8px 8px" }}>
                    <span style={{
                      background:`${c}22`, color:c,
                      fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:30,
                    }}>
                      {garantieLabel(s, g.moisRestants)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── PAGE ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div style={{ background: BG, minHeight:"100vh", padding:"24px 28px", fontFamily:"Manrope, sans-serif" }}>

      {/* HEADER */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28 }}>
        <div>
          <div style={{ color:"#f3f3f4", fontSize:22, fontWeight:800, letterSpacing:-.5 }}>
            Cockpit LVIF Group
          </div>
          <div style={{ color:"#6b6b70", fontSize:12, marginTop:3 }}>
            Sources : TRESO Avril 2026 · Fichier Suivi Maître · eWay CRM
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{
            background:"rgba(197,247,58,.1)", border:"1px solid rgba(197,247,58,.2)",
            borderRadius:30, padding:"6px 14px",
            display:"flex", alignItems:"center", gap:6,
          }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:LIME, boxShadow:`0 0 6px ${LIME}`, display:"inline-block" }} />
            <span style={{ color:LIME, fontSize:11, fontWeight:700 }}>MàJ : 27 juin 2026</span>
          </div>
          <div style={{
            width:42, height:42, borderRadius:"50%",
            background:"linear-gradient(135deg,#3a3a3a,#1f1f1f)",
            display:"flex", alignItems:"center", justifyContent:"center",
            color:LIME, fontWeight:800, fontSize:15, border:"1px solid rgba(255,255,255,0.06)",
          }}>L</div>
        </div>
      </div>

      {/* KPIs */}
      <SectionTitle>Trésorerie — TRESO Avril 2026</SectionTitle>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
        {KPI_DATA.map((k, i) => <KpiCard key={i} {...k} />)}
      </div>

      {/* CA + Decathlon */}
      <SectionTitle>Analyse CA</SectionTitle>
      <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr", gap:14 }}>
        <EvolutionCA />
        <DecathlonRisk />
      </div>

      {/* Operations */}
      <SectionTitle>Opérations — Fichier Suivi Maître (J+15)</SectionTitle>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
        <EventsCard />
        <FixesCard />
        <SavCard />
      </div>

      {/* Garanties */}
      <SectionTitle>Garanties Clients</SectionTitle>
      <GarantiesCard />

      {/* Footer source info */}
      <div style={{ marginTop:28, padding:"14px 18px", background:"rgba(255,255,255,0.02)", borderRadius:14, border:"1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
          <div style={{ color:"#6b6b70", fontSize:11 }}>
            <strong style={{ color:"#9a9a9e" }}>Sources de données :</strong>{" "}
            TRESO AVRIL 2026 V 16-05 (onglets CA, Suivi Garantie) · FICHIER SUIVI MAITRE DEF (onglets EVENTS, FIXES, SAV) · eWay CRM (connexion en attente — upgrade plan Standard requis)
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {[
              { label:"Module Commercial", href:"/commercial" },
              { label:"Module Finance",    href:"/finance" },
              { label:"Module Immobilier", href:"/immobilier" },
            ].map((l) => (
              <a key={l.href} href={l.href} style={{
                color:"#6b6b70", fontSize:11, fontWeight:600,
                textDecoration:"none", padding:"4px 10px",
                background:"rgba(255,255,255,0.04)", borderRadius:20,
              }}>{l.label}</a>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
