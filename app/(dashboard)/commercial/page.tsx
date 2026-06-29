import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";

const LIME = "#C5F73A";

const STATUS_LABELS: Record<string, string> = {
  prospect:      "Prospect",
  qualification: "Qualification",
  proposition:   "Proposition",
  negociation:   "Négociation",
  gagne:         "Gagné ✓",
  perdu:         "Perdu",
};

const COMPANY_DOT: Record<string, string> = {
  LVIF: LIME,
  ENO:  "#a78bfa",
  TJM:  "#34d399",
};

const STAGE_COLORS = ["#3a3a42","#3b4cdb","#ca8a04","#ea580c"];

type Deal = {
  id: string;
  title: string;
  client_name: string | null;
  amount: number | null;
  status: string;
  priority: number | null;
  next_action: string | null;
  next_action_date: string | null;
  close_date: string | null;
  profiles: { full_name: string | null } | null;
  companies: { short_name: string; name: string } | null;
};

// Retourne "Juin 2026" depuis "2026-06-01"
function formatMonthYear(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

export default async function CommercialPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  // Premiers et dernier jours du mois courant
  const now = new Date();
  const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString().split("T")[0];
  const lastDayMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString().split("T")[0];

  const { data: allDeals } = await supabase
    .from("deals")
    .select("*, profiles(full_name), companies(short_name, name)")
    .order("priority", { ascending: false })
    .order("next_action_date", { ascending: true });

  const activeDeals    = allDeals?.filter((d) => !["gagne","perdu"].includes(d.status)) ?? [];
  const overdueDeals   = activeDeals.filter((d) => d.next_action_date && d.next_action_date < today);
  const todayDeals     = activeDeals.filter((d) => d.next_action_date === today);
  const noActionDeals  = activeDeals.filter((d) => !d.next_action);
  const ganneDeals     = allDeals?.filter((d) => d.status === "gagne") ?? [];

  // Deals gagnés ce mois (filtrés par close_date)
  const gagneCeMois = ganneDeals.filter(
    (d) => d.close_date && d.close_date >= firstDayMonth && d.close_date <= lastDayMonth
  );

  const totalPipeline   = activeDeals.reduce((s, d) => s + (d.amount ?? 0), 0);
  const totalGagne      = ganneDeals.reduce((s, d) => s + (d.amount ?? 0), 0);
  const totalGagneMois  = gagneCeMois.reduce((s, d) => s + (d.amount ?? 0), 0);

  const stageOrder     = ["prospect","qualification","proposition","negociation"];
  const pipelineStages = stageOrder.map((s) => {
    const sd = activeDeals.filter((d) => d.status === s);
    return { status: s, label: STATUS_LABELS[s], count: sd.length, amount: sd.reduce((x,d)=>x+(d.amount??0),0) };
  });
  const maxStageCount  = Math.max(...pipelineStages.map((x) => x.count), 1);

  const upcomingDeals = activeDeals.filter(
    (d) => d.next_action_date && d.next_action_date > today &&
           d.next_action_date <= new Date(Date.now()+7*86400000).toISOString().split("T")[0]
  );

  const moisLabel = formatMonthYear(firstDayMonth);

  const card = {
    background:"linear-gradient(160deg,#1b1b1d,#141416)",
    border:"1px solid rgba(255,255,255,0.05)",
    borderRadius:22, padding:"20px 22px",
  } as const;

  return (
    <div style={{ padding:"28px 24px", background:"#0c0c0d", minHeight:"100vh" }}>

      {/* ── Page header ── */}
      <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:26 }}>
        <div>
          <p style={{ color:"#6b6b70", fontSize:12, fontWeight:600, textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>
            LVIF Group — Module
          </p>
          <h1 style={{ color:"#f3f3f4", fontSize:26, fontWeight:700, letterSpacing:-0.5, lineHeight:1 }}>
            Commercial
          </h1>
          <p style={{ color:"#6b6b70", fontSize:13, marginTop:5 }}>
            Pipeline LVIF · Eno Events · TJM — {activeDeals.length} opportunités actives
          </p>
        </div>
        {overdueDeals.length > 0 && (
          <div style={{
            display:"flex", alignItems:"center", gap:6,
            background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.25)",
            color:"#f87171", fontSize:12, fontWeight:700,
            padding:"7px 14px", borderRadius:30,
          }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"#ef4444", display:"inline-block" }} />
            {overdueDeals.length} action{overdueDeals.length>1?"s":""} en retard
          </div>
        )}
      </div>

      {/* ── KPI row (5 cartes) ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:14, marginBottom:20 }}>
        {[
          { label:"Actions en retard",      value:overdueDeals.length,            sub:"À traiter maintenant",           alert:overdueDeals.length>0 },
          { label:"Actions aujourd'hui",    value:todayDeals.length,              sub:"Planifiées ce jour",              alert:false },
          { label:"Pipeline total",         value:formatCurrency(totalPipeline),  sub:`${activeDeals.length} opportunités`, alert:false, lime:true },
          { label:"CA signé (total)",       value:formatCurrency(totalGagne),     sub:`${ganneDeals.length} deal(s) signés`, alert:false },
          { label:`Signé en ${moisLabel}`,  value:formatCurrency(totalGagneMois), sub:`${gagneCeMois.length} deal(s) ce mois`, alert:false, lime: gagneCeMois.length > 0 },
        ].map((k) => (
          <div key={k.label} style={{
            ...card,
            borderColor: k.alert ? "rgba(239,68,68,0.3)" : k.lime && (k.value !== "0 €" && k.value !== "0,00 €") ? "rgba(197,247,58,0.2)" : "rgba(255,255,255,0.05)",
            display:"flex", flexDirection:"column", gap:6,
          }}>
            <span style={{ color:"#6b6b70", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:0.8 }}>
              {k.label}
            </span>
            <span style={{
              color: k.alert ? "#f87171" : k.lime ? LIME : "#f3f3f4",
              fontSize:22, fontWeight:700, letterSpacing:-0.5,
            }}>
              {k.value}
            </span>
            <span style={{ color:"#6b6b70", fontSize:11 }}>{k.sub}</span>
          </div>
        ))}
      </div>

      {/* ── 2 col: Entonnoir + Alertes ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:20 }}>

        {/* Entonnoir */}
        <div style={card}>
          <p style={{ color:"#e9e9ea", fontSize:14, fontWeight:700, marginBottom:16 }}>Entonnoir pipeline</p>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {pipelineStages.map((s,i) => (
              <div key={s.status} style={{ display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ color:"#8b8b8f", fontSize:11, fontWeight:600, width:92, textAlign:"right", flexShrink:0 }}>
                  {s.label}
                </span>
                <div style={{ flex:1, height:30, background:"rgba(255,255,255,0.04)", borderRadius:8, overflow:"hidden", position:"relative" }}>
                  <div style={{
                    width:`${Math.max((s.count/maxStageCount)*100, s.count>0?8:0)}%`,
                    height:"100%", borderRadius:8,
                    background: STAGE_COLORS[i],
                    display:"flex", alignItems:"center", paddingLeft:10,
                    transition:"width 0.4s ease",
                  }}>
                    {s.count>0 && <span style={{ color:"#fff", fontSize:11, fontWeight:700 }}>{s.count}</span>}
                  </div>
                </div>
                <span style={{ color:"#8b8b8f", fontSize:11, fontWeight:600, width:90, textAlign:"right", flexShrink:0 }}>
                  {s.amount>0?formatCurrency(s.amount):"—"}
                </span>
              </div>
            ))}
          </div>
          <div style={{ marginTop:16, paddingTop:14, borderTop:"1px solid rgba(255,255,255,0.06)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:LIME, display:"inline-block" }} />
              <span style={{ color:"#a3a3a8", fontSize:11, fontWeight:600 }}>Deals signés (total)</span>
            </div>
            <div>
              <span style={{ color:LIME, fontSize:12, fontWeight:700 }}>{formatCurrency(totalGagne)}</span>
              <span style={{ color:"#6b6b70", fontSize:11, marginLeft:6 }}>({ganneDeals.length} deals)</span>
            </div>
          </div>
        </div>

        {/* Alertes */}
        <div style={card}>
          <p style={{ color:"#e9e9ea", fontSize:14, fontWeight:700, marginBottom:16 }}>Attention requise</p>
          {overdueDeals.length===0 && noActionDeals.length===0 ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flex:1, padding:"24px 0", textAlign:"center" }}>
              <div style={{ fontSize:32, marginBottom:8 }}>✅</div>
              <p style={{ color:"#f3f3f4", fontSize:14, fontWeight:600 }}>Tout est à jour</p>
              <p style={{ color:"#6b6b70", fontSize:12, marginTop:4 }}>Aucune action en retard</p>
            </div>
          ):(
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {overdueDeals.slice(0,5).map((d)=>{
                const co = d.companies as {short_name:string}|null;
                return (
                  <div key={d.id} style={{
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)",
                    borderRadius:12, padding:"10px 14px",
                  }}>
                    <div>
                      <p style={{ color:"#fca5a5", fontSize:12, fontWeight:700 }}>{d.title}</p>
                      <p style={{ color:"#f87171", fontSize:11, marginTop:2 }}>{d.client_name} · {d.next_action}</p>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                      {co && (
                        <span style={{
                          fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:20,
                          background:"rgba(255,255,255,0.08)", color:"#e9e9ea",
                        }}>{co.short_name}</span>
                      )}
                      <span style={{ color:"#f87171", fontSize:11, fontWeight:600 }}>
                        {d.next_action_date?formatDate(d.next_action_date):"—"}
                      </span>
                    </div>
                  </div>
                );
              })}
              {noActionDeals.length>0 && (
                <div style={{
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                  background:"rgba(234,179,8,0.08)", border:"1px solid rgba(234,179,8,0.2)",
                  borderRadius:12, padding:"10px 14px",
                }}>
                  <p style={{ color:"#fde68a", fontSize:12, fontWeight:600 }}>
                    {noActionDeals.length} deal{noActionDeals.length>1?"s":""} sans prochaine action
                  </p>
                  <span style={{ color:"#fbbf24", fontSize:11, fontWeight:700 }}>→ à planifier</span>
                </div>
              )}
            </div>
          )}
          {upcomingDeals.length>0 && (
            <div style={{ marginTop:14, paddingTop:12, borderTop:"1px solid rgba(255,255,255,0.06)" }}>
              <p style={{ color:"#6b6b70", fontSize:11, fontWeight:600, marginBottom:8, textTransform:"uppercase", letterSpacing:0.7 }}>
                Cette semaine ({upcomingDeals.length})
              </p>
              {upcomingDeals.slice(0,3).map((d)=>(
                <div key={d.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                  <span style={{ color:"#a3a3a8", fontSize:12, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{d.title}</span>
                  <span style={{ color:"#6b6b70", fontSize:11, marginLeft:10, flexShrink:0 }}>{d.next_action_date?formatDate(d.next_action_date):"—"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION : Deals gagnés ce mois ── */}
      <div style={{ marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
          <span style={{ width:8, height:8, borderRadius:"50%", background:LIME, display:"inline-block", flexShrink:0 }} />
          <p style={{ color:LIME, fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:1 }}>
            Deals gagnés — {moisLabel}
          </p>
          <span style={{
            background:"rgba(197,247,58,0.15)", color:LIME, fontSize:11, fontWeight:700,
            padding:"2px 10px", borderRadius:20, border:"1px solid rgba(197,247,58,0.3)",
          }}>
            {gagneCeMois.length} deal{gagneCeMois.length !== 1 ? "s" : ""} · {formatCurrency(totalGagneMois)}
          </span>
        </div>

        {gagneCeMois.length === 0 ? (
          <div style={{
            ...card,
            display:"flex", alignItems:"center", justifyContent:"center",
            padding:"32px 20px", textAlign:"center", border:"1px dashed rgba(197,247,58,0.15)",
          }}>
            <div>
              <p style={{ color:"#6b6b70", fontSize:14, fontWeight:600 }}>Aucun deal gagné ce mois</p>
              <p style={{ color:"#4b4b50", fontSize:12, marginTop:5 }}>
                Les deals passés en "Won" dans eWay apparaîtront ici après la prochaine synchronisation.
              </p>
            </div>
          </div>
        ) : (
          <DealTable deals={gagneCeMois} today={today} variant="won" />
        )}
      </div>

      {/* ── Actions en retard ── */}
      {overdueDeals.length>0 && (
        <div style={{ marginBottom:20 }}>
          <p style={{ color:"#f87171", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>
            ⚠ Actions en retard ({overdueDeals.length})
          </p>
          <DealTable deals={overdueDeals} today={today} variant="overdue" />
        </div>
      )}

      {/* ── Actions du jour ── */}
      {todayDeals.length>0 && (
        <div style={{ marginBottom:20 }}>
          <p style={{ color:"#fb923c", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>
            Aujourd'hui ({todayDeals.length})
          </p>
          <DealTable deals={todayDeals} today={today} />
        </div>
      )}

      {/* ── Tous les deals actifs ── */}
      <div style={{ marginBottom:20 }}>
        <p style={{ color:"#6b6b70", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>
          Tous les deals actifs ({activeDeals.length})
        </p>
        {activeDeals.length>0 ? (
          <DealTable deals={activeDeals} today={today} />
        ) : (
          <div style={{
            background:"linear-gradient(160deg,#1b1b1d,#141416)",
            border:"1px dashed rgba(255,255,255,0.08)", borderRadius:18, padding:"40px 20px", textAlign:"center",
          }}>
            <p style={{ color:"#f3f3f4", fontSize:14, fontWeight:600 }}>Aucun deal actif — tout est à jour 🎉</p>
            <p style={{ color:"#6b6b70", fontSize:12, marginTop:6 }}>
              Les deals seront synchronisés depuis eWay CRM toutes les 15 minutes.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}

function DealTable({
  deals, today, variant,
}: {
  deals: Deal[];
  today: string;
  variant?: "overdue" | "no-action" | "won";
}) {
  const tableCard = {
    background:"linear-gradient(160deg,#1b1b1d,#141416)",
    border:"1px solid rgba(255,255,255,0.05)", borderRadius:18, overflow:"hidden",
  } as const;
  const thStyle = {
    textAlign:"left" as const, padding:"12px 16px",
    color:"#6b6b70", fontSize:11, fontWeight:600, textTransform:"uppercase" as const,
    letterSpacing:0.7, borderBottom:"1px solid rgba(255,255,255,0.05)",
  };
  const tdStyle = {
    padding:"13px 16px", borderBottom:"1px solid rgba(255,255,255,0.04)", verticalAlign:"middle" as const,
  };

  const STATUS_PILL: Record<string,{bg:string;color:string}> = {
    prospect:      {bg:"rgba(107,107,112,0.2)",  color:"#a3a3a8"},
    qualification: {bg:"rgba(59,76,219,0.2)",   color:"#93c5fd"},
    proposition:   {bg:"rgba(202,138,4,0.2)",   color:"#fde68a"},
    negociation:   {bg:"rgba(234,88,12,0.2)",   color:"#fdba74"},
    gagne:         {bg:"rgba(52,211,153,0.2)",  color:"#6ee7b7"},
    perdu:         {bg:"rgba(239,68,68,0.2)",   color:"#fca5a5"},
  };

  const isWonTable = variant === "won";

  return (
    <div style={{
      ...tableCard,
      border: isWonTable ? "1px solid rgba(197,247,58,0.12)" : tableCard.border,
    }}>
      <table style={{ width:"100%", borderCollapse:"collapse" }}>
        <thead>
          <tr>
            <th style={thStyle}>Deal / Client</th>
            <th style={thStyle}>Société</th>
            {!isWonTable && <th style={thStyle}>Statut</th>}
            {!isWonTable && <th style={thStyle}>Prochaine action</th>}
            {isWonTable && <th style={thStyle}>Date signature</th>}
            <th style={{...thStyle, textAlign:"right"}}>Montant</th>
            {!isWonTable && <th style={{...thStyle, textAlign:"right"}}>Échéance</th>}
          </tr>
        </thead>
        <tbody>
          {deals.map((deal)=>{
            const isLate = variant==="overdue"||(deal.next_action_date&&deal.next_action_date<today&&!isWonTable);
            const co = deal.companies;
            const pill = STATUS_PILL[deal.status]||{bg:"rgba(107,107,112,0.2)",color:"#a3a3a8"};
            const dotColor = co ? (COMPANY_DOT[co.short_name]||"#8b8b8f") : "#8b8b8f";
            return (
              <tr key={deal.id} style={{
                background: isLate ? "rgba(239,68,68,0.04)" : isWonTable ? "rgba(197,247,58,0.02)" : "transparent",
              }}>
                <td style={tdStyle}>
                  <p style={{ color:"#f3f3f4", fontSize:13, fontWeight:600 }}>{deal.title}</p>
                  {deal.client_name && <p style={{ color:"#6b6b70", fontSize:11, marginTop:2 }}>{deal.client_name}</p>}
                </td>
                <td style={tdStyle}>
                  {co && (
                    <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                      <span style={{ width:6, height:6, borderRadius:"50%", background:dotColor, display:"inline-block" }} />
                      <span style={{ color:"#a3a3a8", fontSize:12, fontWeight:600 }}>{co.short_name}</span>
                    </div>
                  )}
                </td>
                {!isWonTable && (
                  <td style={tdStyle}>
                    <span style={{
                      display:"inline-flex", padding:"3px 10px", borderRadius:20,
                      background:pill.bg, color:pill.color, fontSize:11, fontWeight:600,
                    }}>
                      {STATUS_LABELS[deal.status]||deal.status}
                    </span>
                  </td>
                )}
                {!isWonTable && (
                  <td style={tdStyle}>
                    {deal.next_action
                      ? <span style={{ color:"#a3a3a8", fontSize:12 }}>{deal.next_action}</span>
                      : <span style={{ color:"#ca8a04", fontSize:12, fontStyle:"italic" }}>Aucune action définie</span>
                    }
                  </td>
                )}
                {isWonTable && (
                  <td style={tdStyle}>
                    <span style={{ color:LIME, fontSize:12, fontWeight:600 }}>
                      {deal.close_date ? formatDate(deal.close_date) : "—"}
                    </span>
                  </td>
                )}
                <td style={{...tdStyle, textAlign:"right"}}>
                  <span style={{ color: isWonTable ? LIME : "#f3f3f4", fontSize:13, fontWeight:700 }}>
                    {deal.amount ? formatCurrency(deal.amount) : "—"}
                  </span>
                </td>
                {!isWonTable && (
                  <td style={{...tdStyle, textAlign:"right"}}>
                    <span style={{ color: isLate?"#f87171":"#8b8b8f", fontSize:11, fontWeight:600 }}>
                      {deal.next_action_date ? formatDate(deal.next_action_date) : "—"}
                    </span>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
