"use client";

// LVIF Group Dashboard - Ride Dashboard style replica
// Colors: bg #0c0c0d, cards #1b1b1d->141416, accent #C5F73A
// Font: Manrope (via root layout)

import React from "react";

const LIME = "#C5F73A";

const cardBase: React.CSSProperties = {
  background: "linear-gradient(160deg,#1b1b1d,#141416)",
  border: "1px solid rgba(255,255,255,0.05)",
  borderRadius: 22,
  padding: 20,
  display: "flex",
  flexDirection: "column",
};

function CardHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
      <span style={{ color:"#e9e9ea", fontSize:15, fontWeight:700 }}>{title}</span>
      {right ?? <span style={{ color:"#6b6b70", fontSize:18, letterSpacing:1 }}>...</span>}
    </div>
  );
}

function Avatar({ letter, size=46 }: { letter:string; size?:number }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%",
      background:"linear-gradient(135deg,#3a3a3a,#1f1f1f)",
      display:"flex", alignItems:"center", justifyContent:"center",
      color:LIME, fontWeight:700, fontSize:size<42?13:14, flexShrink:0,
    }}>{letter}</div>
  );
}

function StarIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill={LIME}>
      <path d="M12 2l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 18.6 6.1 20.2l1.2-6.6L2.5 9l6.6-.9z" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M9 6l6 6-6 6" stroke="#6b6b70" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ---- COLUMN 1 ----

function CardNextDeal() {
  return (
    <div style={{ ...cardBase, flex:1.5 }}>
      <CardHeader title="Prochain Deal" />
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
        <Avatar letter="K" />
        <div style={{ lineHeight:1.3 }}>
          <div style={{ color:"#f3f3f4", fontSize:14, fontWeight:700 }}>Karim Mansouri</div>
          <div style={{ display:"flex", alignItems:"center", gap:4, color:"#8b8b8f", fontSize:11 }}>
            <StarIcon />4.8 · 1 240 avis clients
          </div>
        </div>
      </div>
      <div style={{ height:1, background:"rgba(255,255,255,0.06)", marginBottom:16 }} />
      <span style={{ color:"#7d7d82", fontSize:12, fontWeight:600, marginBottom:6, display:"block" }}>Destination</span>
      <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", gap:12 }}>
        <span style={{ color:"#e9e9ea", fontSize:14, fontWeight:600, lineHeight:1.4 }}>14 Rue de la Paix,<br/>Paris 75001</span>
        <button style={{
          background:"#1f1f22", color:"#e9e9ea",
          border:"1px solid rgba(255,255,255,0.08)", borderRadius:30,
          padding:"9px 16px", fontSize:12, fontWeight:600,
          fontFamily:"inherit", cursor:"pointer", whiteSpace:"nowrap",
        }}>Voir details</button>
      </div>
    </div>
  );
}

function CardRevenusBar() {
  const bars = [
    { h:46, day:"L" },{ h:66, day:"M" },{ h:40, day:"M" },
    { h:78, day:"J" },{ h:100, day:"V", lime:true },{ h:54, day:"S" },
  ] as const;
  return (
    <div style={{ ...cardBase, flex:1.05 }}>
      <CardHeader title="Revenus semaine" />
      <div style={{ flex:1, display:"flex", alignItems:"flex-end", gap:14, paddingTop:8 }}>
        {bars.map((b,i) => (
          <div key={i} style={{
            height: "lime" in b && b.lime ? "100%" : b.h,
            width: "lime" in b && b.lime ? 30 : 26,
            borderRadius: "lime" in b && b.lime ? 9 : 7,
            background: "lime" in b && b.lime ? "linear-gradient(180deg,#C5F73A,#9bd219)" : "rgba(255,255,255,0.07)",
            boxShadow: "lime" in b && b.lime ? "0 0 24px rgba(197,247,58,0.4)" : "none",
            flexShrink:0,
          }} />
        ))}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:10, color:"#6b6b70", fontSize:11, fontWeight:600, padding:"0 6px" }}>
        {bars.map((b,i) => <span key={i}>{b.day}</span>)}
      </div>
    </div>
  );
}

function CardActiviteRecente() {
  const items = [
    { letter:"S", name:"SCI Belleville", sub:"Bail commercial · 4 200 EUR", date:"23 juin · 10:30" },
    { letter:"E", name:"ENO Solutions",  sub:"Mission TJM · 6 800 EUR",    date:"22 juin · 17:15" },
  ];
  return (
    <div style={{ ...cardBase, flex:1.1 }}>
      <CardHeader title="Activite recente" />
      <div style={{ display:"flex", flexDirection:"column", gap:10, flex:1 }}>
        {items.map((it) => (
          <div key={it.name} style={{
            display:"flex", alignItems:"center", gap:12,
            background:"#161618", borderRadius:16, padding:"11px 14px", cursor:"pointer",
          }}>
            <Avatar letter={it.letter} size={40} />
            <div style={{ display:"flex", flexDirection:"column", flex:1, lineHeight:1.35 }}>
              <span style={{ color:"#f3f3f4", fontSize:13, fontWeight:700 }}>{it.name}</span>
              <span style={{ color:"#7d7d82", fontSize:11 }}>{it.sub}</span>
            </div>
            <span style={{ color:"#8b8b8f", fontSize:10 }}>{it.date}</span>
            <ChevronRight />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- COLUMN 2 ----

function CardTresorerie() {
  return (
    <div style={{ ...cardBase, flex:1.3 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <span style={{
          display:"flex", alignItems:"center", gap:6,
          background:"rgba(197,247,58,0.13)", color:LIME,
          fontSize:11, fontWeight:700, padding:"5px 11px", borderRadius:30,
        }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:LIME, display:"inline-block" }} />
          +18% ce mois
        </span>
        <span style={{ color:"#6b6b70", fontSize:18, letterSpacing:1 }}>...</span>
      </div>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
        <div style={{ display:"flex", flexDirection:"column" }}>
          <span style={{ color:"#7d7d82", fontSize:12, fontWeight:600, marginBottom:2 }}>Tresorerie</span>
          <span style={{ color:"#f3f3f4", fontSize:32, fontWeight:700, letterSpacing:-1 }}>28 450 EUR</span>
        </div>
        <svg width="90" height="46" viewBox="0 0 90 46" fill="none" style={{ marginTop:8 }}>
          <defs>
            <linearGradient id="spk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#C5F73A" stopOpacity="0.35" />
              <stop offset="1" stopColor="#C5F73A" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 36 L14 30 L28 33 L42 20 L56 24 L70 10 L90 4 L90 46 L0 46 Z" fill="url(#spk)" />
          <path d="M0 36 L14 30 L28 33 L42 20 L56 24 L70 10 L90 4" stroke="#C5F73A" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div style={{ flex:1 }} />
      <button style={{
        width:"100%",
        background:"linear-gradient(180deg,#C5F73A,#a9da22)",
        color:"#0c0c0d", border:"none", borderRadius:30, padding:14,
        fontSize:14, fontWeight:800, fontFamily:"inherit", cursor:"pointer",
        boxShadow:"0 8px 24px rgba(197,247,58,0.28)",
      }}>Virement</button>
    </div>
  );
}

function CardSanteFinanciere() {
  const C = 251.2;
  return (
    <div style={{ ...cardBase, flex:1.05 }}>
      <CardHeader title="Sante Financiere" right={
        <span style={{
          display:"flex", alignItems:"center", gap:5,
          background:"#161618", border:"1px solid rgba(255,255,255,0.07)",
          color:"#9a9a9e", fontSize:11, fontWeight:600,
          padding:"5px 10px", borderRadius:20,
        }}>
          Ce mois
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      } />
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"space-around", gap:14 }}>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
          <div style={{ position:"relative", width:96, height:96 }}>
            <svg width="96" height="96" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="9" />
              <circle cx="48" cy="48" r="40" fill="none" stroke="#C5F73A" strokeWidth="9" strokeLinecap="round"
                strokeDasharray={C} strokeDashoffset={C * 0.3} transform="rotate(-90 48 48)" />
            </svg>
            <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", color:LIME }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
                <path d="M14.5 8.5A4 4 0 008 12a4 4 0 006.5 3.1M7 11h6M7 13h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <span style={{ color:"#9a9a9e", fontSize:12, fontWeight:600 }}>Creances</span>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
          <div style={{ position:"relative", width:96, height:96 }}>
            <svg width="96" height="96" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="9" />
              <circle cx="48" cy="48" r="40" fill="none" stroke="#5a5a5f" strokeWidth="9" strokeLinecap="round"
                strokeDasharray={C} strokeDashoffset={C * 0.7} transform="rotate(-90 48 48)" />
            </svg>
            <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", color:"#9a9a9e" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                <path d="M14 2v6h6M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <span style={{ color:"#9a9a9e", fontSize:12, fontWeight:600 }}>Dettes</span>
        </div>
      </div>
    </div>
  );
}

function CardPipeline() {
  return (
    <div style={{ ...cardBase, flex:1.25 }}>
      <CardHeader title="Pipeline Commercial" />
      <div style={{ flex:1, display:"flex", alignItems:"flex-end" }}>
        <svg width="100%" height="100%" viewBox="0 0 300 110" preserveAspectRatio="none">
          <defs>
            <linearGradient id="pipe" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#C5F73A" stopOpacity="0.45" />
              <stop offset="1" stopColor="#C5F73A" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 95 L25 80 L50 88 L75 60 L100 72 L125 40 L150 58 L175 30 L200 48 L225 20 L250 38 L275 12 L300 26 L300 110 L0 110 Z" fill="url(#pipe)" />
          <path d="M0 95 L25 80 L50 88 L75 60 L100 72 L125 40 L150 58 L175 30 L200 48 L225 20 L250 38 L275 12 L300 26"
            stroke="#C5F73A" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:7, marginTop:8 }}>
        <span style={{ width:7, height:7, borderRadius:"50%", background:LIME, boxShadow:`0 0 8px ${LIME}`, display:"inline-block" }} />
        <span style={{ color:"#9a9a9e", fontSize:12, fontWeight:600 }}>Opportunites actives : 34</span>
      </div>
    </div>
  );
}

// ---- COLUMN 3 ----

function CardZones() {
  const pins = [
    { left:"24%", top:"32%", main:true },
    { left:"58%", top:"24%", main:false },
    { left:"70%", top:"56%", main:true },
    { left:"40%", top:"60%", main:false },
  ];
  return (
    <div style={{ ...cardBase, flex:1.4, overflow:"hidden" }}>
      <CardHeader title="Zones intervention" />
      <div style={{
        flex:1, position:"relative", borderRadius:14,
        backgroundImage:"radial-gradient(rgba(255,255,255,0.13) 1.4px, transparent 1.4px)",
        backgroundSize:"13px 13px", overflow:"hidden",
      }}>
        {pins.map((p,i) => (
          <div key={i} style={{ position:"absolute", left:p.left, top:p.top, color: p.main ? LIME : "rgba(255,255,255,0.5)" }}>
            <svg width={p.main?22:18} height={p.main?22:18} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z" />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardDeals() {
  return (
    <div style={{ ...cardBase, flex:0.92 }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:14 }}>
        <span style={{ color:"#f3f3f4", fontSize:30, fontWeight:700, letterSpacing:-1 }}>247</span>
        <span style={{
          display:"flex", alignItems:"center", gap:5,
          background:"#161618", border:"1px solid rgba(255,255,255,0.07)",
          color:"#9a9a9e", fontSize:11, fontWeight:600, padding:"5px 10px", borderRadius:20,
        }}>
          Ce trimestre
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
      <div style={{ position:"relative", height:30, marginBottom:12 }}>
        <div style={{ position:"absolute", left:"62%", top:-4, color:LIME }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
            <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2M12 12v4M10 14h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </div>
      </div>
      <div style={{ height:8, borderRadius:6, background:"rgba(255,255,255,0.07)", overflow:"hidden", marginBottom:10 }}>
        <div style={{ width:"64%", height:"100%", borderRadius:6, background:"linear-gradient(90deg,#9bd219,#C5F73A)" }} />
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", color:"#6b6b70", fontSize:11, fontWeight:600 }}>
        <span>Jan</span><span>Avr</span><span>Juil</span>
      </div>
    </div>
  );
}

function CardPerformance() {
  const C = 276.4;
  const rings = [
    { offset: C * 0.2, label:"Taux fermeture", value:"80%" },
    { offset: C * 0.05, label:"Satisfaction",   value:"4.9" },
  ];
  return (
    <div style={{ ...cardBase, flex:1.25 }}>
      <CardHeader title="Performance" />
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"space-around" }}>
        {rings.map((r) => (
          <div key={r.label} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
            <div style={{ position:"relative", width:104, height:104 }}>
              <svg width="104" height="104" viewBox="0 0 104 104">
                <circle cx="52" cy="52" r="44" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="9" />
                <circle cx="52" cy="52" r="44" fill="none" stroke="#C5F73A" strokeWidth="9" strokeLinecap="round"
                  strokeDasharray={C} strokeDashoffset={r.offset} transform="rotate(-90 52 52)" />
              </svg>
              <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", color:"#f3f3f4", fontSize:19, fontWeight:700 }}>
                {r.value}
              </div>
            </div>
            <span style={{ display:"flex", alignItems:"center", gap:6, color:"#9a9a9e", fontSize:12, fontWeight:600 }}>
              <span style={{ width:7, height:7, borderRadius:"50%", background:LIME, display:"inline-block" }} />
              {r.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- MAIN PAGE ----

export default function DashboardPage() {
  return (
    <div style={{ height:"100%", minHeight:"100vh", background:"#0c0c0d", display:"flex", flexDirection:"column", padding:"24px 26px" }}>
      {/* TOPBAR */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", gap:16, marginBottom:22, flexShrink:0 }}>
        <div style={{
          width:44, height:44, borderRadius:"50%",
          background:"#161618", border:"1px solid rgba(255,255,255,0.06)",
          display:"flex", alignItems:"center", justifyContent:"center",
          color:"#9a9a9e", cursor:"pointer",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.9" />
            <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
          </svg>
        </div>
        <div style={{
          display:"flex", alignItems:"center", gap:11,
          background:"#161618", border:"1px solid rgba(255,255,255,0.06)",
          borderRadius:40, padding:"5px 16px 5px 5px", cursor:"pointer",
        }}>
          <div style={{
            width:36, height:36, borderRadius:"50%",
            background:"linear-gradient(135deg,#3a3a3a,#1f1f1f)",
            display:"flex", alignItems:"center", justifyContent:"center",
            color:LIME, fontWeight:700, fontSize:14,
          }}>L</div>
          <div style={{ display:"flex", flexDirection:"column", lineHeight:1.25 }}>
            <span style={{ color:"#f3f3f4", fontSize:13, fontWeight:700 }}>LVIF Group</span>
            <span style={{ display:"flex", alignItems:"center", gap:3, color:"#8b8b8f", fontSize:11, fontWeight:500 }}>
              <StarIcon />Direction
            </span>
          </div>
        </div>
      </div>

      {/* 3x3 GRID */}
      <div style={{ flex:1, display:"grid", gridTemplateColumns:"1.05fr 0.92fr 1.05fr", gap:16, minHeight:0 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:16, minHeight:0 }}>
          <CardNextDeal />
          <CardRevenusBar />
          <CardActiviteRecente />
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:16, minHeight:0 }}>
          <CardTresorerie />
          <CardSanteFinanciere />
          <CardPipeline />
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:16, minHeight:0 }}>
          <CardZones />
          <CardDeals />
          <CardPerformance />
        </div>
      </div>
    </div>
  );
}
