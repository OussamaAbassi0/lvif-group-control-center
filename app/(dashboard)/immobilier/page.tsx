import { createClient } from "@/lib/supabase/server";
import { BuildingPlan } from "@/components/immobilier/building-plan";
import { formatCurrency, formatDate, getDaysUntil, formatPercent } from "@/lib/utils";

const LIME = "#C5F73A";

export default async function ImmobilierPage() {
  const supabase = await createClient();
  const currentMonth = new Date().toISOString().slice(0,7);
  const today = new Date().toISOString().split("T")[0];

  const { data: sites } = await supabase
    .from("sites")
    .select(`
      id, name, city, address, total_surface,
      units(
        id, name, surface, floor, status, monthly_rent,
        position_x, position_y, width, height,
        tenants(
          id, company_name, rent_amount, lease_end, lease_type,
          tenant_documents(type, expiry_date, status),
          rent_payments(month, expected_amount, received_amount, status)
        )
      )
    `)
    .order("name");

  const { data: tenants } = await supabase
    .from("tenants")
    .select(`
      *,
      units(name, surface, site_id, sites(name, city)),
      tenant_documents(type, expiry_date, status),
      rent_payments(month, expected_amount, received_amount, status)
    `)
    .order("company_name");

  const allUnits       = sites?.flatMap((s)=>s.units??[])??[];
  const occupiedUnits  = allUnits.filter((u)=>u.status==="occupied");
  const vacantUnits    = allUnits.filter((u)=>u.status==="vacant");
  const occupancyRate  = allUnits.length ? (occupiedUnits.length/allUnits.length)*100 : 0;
  const totalRentMonthly = tenants?.reduce((s,t)=>s+(t.rent_amount??0),0)??0;
  const totalRentAnnual  = totalRentMonthly*12;

  const expiringSoonLeases = tenants?.filter((t)=>{
    if(!t.lease_end) return false;
    const d = getDaysUntil(t.lease_end);
    return d>=0&&d<=90;
  })??[];
  const alertDocs = tenants?.filter((t)=>
    t.tenant_documents?.some((d: {type:string;status:string;expiry_date:string|null})=>
      d.type==="insurance"&&["expired","missing","expiring_soon"].includes(d.status)
    )
  )??[];
  const overdueRents  = tenants?.filter((t)=>t.rent_payments?.some((p: {month:string;status:string})=>p.month===currentMonth&&p.status==="overdue"))??[];
  const pendingRents  = tenants?.filter((t)=>t.rent_payments?.some((p: {month:string;status:string})=>p.month===currentMonth&&p.status==="pending"))??[];
  const collectedThisMonth = tenants?.reduce((s,t)=>{
    const p = t.rent_payments?.find((rp: {month:string;status:string;received_amount:number|null})=>rp.month===currentMonth&&rp.status==="paid");
    return s+(p?.received_amount??0);
  },0)??0;
  const recoveryRate = totalRentMonthly>0?(collectedThisMonth/totalRentMonthly)*100:0;
  const totalAlerts  = overdueRents.length+alertDocs.length+expiringSoonLeases.length;

  const card = {
    background:"linear-gradient(160deg,#1b1b1d,#141416)",
    border:"1px solid rgba(255,255,255,0.05)", borderRadius:22, padding:"20px 22px",
  } as const;
  const thStyle = {
    textAlign:"left" as const, padding:"12px 16px",
    color:"#6b6b70", fontSize:11, fontWeight:600,
    textTransform:"uppercase" as const, letterSpacing:0.7,
    borderBottom:"1px solid rgba(255,255,255,0.05)",
  };
  const tdStyle = {
    padding:"13px 16px", borderBottom:"1px solid rgba(255,255,255,0.04)",
    verticalAlign:"middle" as const,
  };

  const PAY_STYLE: Record<string,{bg:string;color:string;label:string}> = {
    paid:          {bg:"rgba(52,211,153,0.15)", color:"#6ee7b7", label:"Payé ✓"},
    pending:       {bg:"rgba(234,179,8,0.15)",  color:"#fde68a", label:"En attente"},
    overdue:       {bg:"rgba(239,68,68,0.15)",  color:"#fca5a5", label:"Impayé !"},
    valid:         {bg:"rgba(52,211,153,0.15)", color:"#6ee7b7", label:"Valide ✓"},
    expiring_soon: {bg:"rgba(234,88,12,0.15)",  color:"#fdba74", label:"Expire bientôt"},
    expired:       {bg:"rgba(239,68,68,0.15)",  color:"#fca5a5", label:"Expirée ✗"},
    missing:       {bg:"rgba(107,107,112,0.15)",color:"#9ca3af", label:"Manquante"},
  };

  return (
    <div style={{ padding:"28px 24px", background:"#0c0c0d", minHeight:"100vh" }}>

      {/* ── Header ── */}
      <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:26 }}>
        <div>
          <p style={{ color:"#6b6b70", fontSize:12, fontWeight:600, textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>
            LVIF Group — Module
          </p>
          <h1 style={{ color:"#f3f3f4", fontSize:26, fontWeight:700, letterSpacing:-0.5 }}>Immobilier</h1>
          <p style={{ color:"#6b6b70", fontSize:13, marginTop:5 }}>
            Saint-Rémy-de-Provence &amp; Auxerre — SCI Maya
          </p>
        </div>
        {totalAlerts>0 && (
          <div style={{
            display:"flex", alignItems:"center", gap:6,
            background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.25)",
            color:"#f87171", fontSize:12, fontWeight:700, padding:"7px 14px", borderRadius:30,
          }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"#ef4444", display:"inline-block" }} />
            {totalAlerts} alerte{totalAlerts>1?"s":""}
          </div>
        )}
      </div>

      {/* ── KPIs ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:20 }}>
        {[
          { label:"Taux d'occupation",         value:formatPercent(occupancyRate),        sub:`${occupiedUnits.length} occupés · ${vacantUnits.length} vacants`, lime:occupancyRate>=90 },
          { label:"Loyers mensuels",            value:formatCurrency(totalRentMonthly),    sub:`${formatCurrency(totalRentAnnual)}/an`, lime:true },
          { label:"Recouvrement",               value:formatPercent(recoveryRate),         sub:`${formatCurrency(collectedThisMonth)} encaissé`, alert:recoveryRate<90&&totalRentMonthly>0 },
          { label:"Alertes actives",            value:totalAlerts,                         sub:"Loyers · docs · baux", alert:totalAlerts>0 },
        ].map((k)=>(
          <div key={k.label} style={{
            ...card,
            borderColor: k.alert?"rgba(239,68,68,0.3)":"rgba(255,255,255,0.05)",
            display:"flex", flexDirection:"column", gap:6,
          }}>
            <span style={{ color:"#6b6b70", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:0.8 }}>{k.label}</span>
            <span style={{ color:k.alert?"#f87171":k.lime?LIME:"#f3f3f4", fontSize:24, fontWeight:700, letterSpacing:-0.5 }}>
              {k.value}
            </span>
            <span style={{ color:"#6b6b70", fontSize:11 }}>{k.sub}</span>
          </div>
        ))}
      </div>

      {/* ── Alertes prioritaires ── */}
      {totalAlerts>0 && (
        <div style={{ marginBottom:20 }}>
          <p style={{ color:"#f87171", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>
            ⚠ Alertes prioritaires
          </p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
            {overdueRents.length>0 && (
              <AlertBlock title="Loyers impayés" color="#ef4444" items={
                overdueRents.map((t)=>({
                  label: t.company_name,
                  sub: `${formatCurrency(t.rent_amount)} · ${(t.units as {sites:{name:string}}|null)?.sites?.name??""}`,
                  badge: "Impayé",
                }))
              } />
            )}
            {alertDocs.length>0 && (
              <AlertBlock title="Assurances à régulariser" color="#f97316" items={
                alertDocs.map((t)=>{
                  const doc = t.tenant_documents?.find((d: {type:string;status:string})=>d.type==="insurance");
                  return {
                    label: t.company_name,
                    sub: (t.units as {sites:{name:string}}|null)?.sites?.name??"",
                    badge: doc?.status==="expired"?"Expirée":doc?.status==="missing"?"Manquante":"Expire bientôt",
                  };
                })
              } />
            )}
            {expiringSoonLeases.length>0 && (
              <AlertBlock title="Baux à renouveler" color="#eab308" items={
                expiringSoonLeases.map((t)=>({
                  label: t.company_name,
                  sub: `Expire ${formatDate(t.lease_end!)} · dans ${getDaysUntil(t.lease_end!)}j`,
                  badge: `${getDaysUntil(t.lease_end!)}j`,
                }))
              } />
            )}
          </div>
        </div>
      )}

      {/* ── Sites immobiliers ── */}
      {sites?.map((site)=>{
        const siteUnits = (site.units??[]) as Array<{
          id:string; name:string; surface:number; status:string; monthly_rent:number|null;
          position_x:number|null; position_y:number|null; width:number|null; height:number|null;
          tenants:Array<{
            id:string; company_name:string; rent_amount:number; lease_end:string|null;
            tenant_documents:Array<{type:string;status:string;expiry_date:string|null}>;
            rent_payments:Array<{month:string;status:string}>;
          }>|null;
        }>;
        const siteTenantCount = siteUnits.filter((u)=>u.status==="occupied").length;
        const siteVacantCount = siteUnits.filter((u)=>u.status==="vacant").length;
        const siteMonthlyRent = siteUnits.reduce((s,u)=>s+((u.tenants?.[0]?.rent_amount)??0),0);

        const planUnits = siteUnits.map((u)=>{
          const tenant = u.tenants?.[0]??null;
          const insurance = tenant?.tenant_documents?.find((d)=>d.type==="insurance");
          const currentPayment = tenant?.rent_payments?.find((p)=>p.month===currentMonth);
          return {
            id:u.id, name:u.name, surface:u.surface, status:u.status,
            monthly_rent:u.monthly_rent,
            position_x:u.position_x, position_y:u.position_y, width:u.width, height:u.height,
            tenant: tenant ? {
              company_name:tenant.company_name, rent_amount:tenant.rent_amount, lease_end:tenant.lease_end,
              payment_status:currentPayment?.status??"pending",
              insurance_status:insurance?.status??"missing",
            } : null,
          };
        });

        return (
          <div key={site.id} style={{ marginBottom:28 }}>
            {/* Site header */}
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:14 }}>
              <div>
                <h2 style={{ color:"#f3f3f4", fontSize:17, fontWeight:700, display:"flex", alignItems:"center", gap:8 }}>
                  🏢 {site.name}
                </h2>
                <p style={{ color:"#6b6b70", fontSize:12, marginTop:3 }}>{site.address}</p>
              </div>
              <div style={{
                display:"flex", alignItems:"center", gap:16,
                background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.06)",
                borderRadius:12, padding:"8px 14px", fontSize:12,
              }}>
                <span><span style={{ color:"#f3f3f4", fontWeight:700 }}>{siteTenantCount}</span><span style={{ color:"#6b6b70" }}> occupés</span></span>
                <span><span style={{ color:"#6b6b70", fontWeight:700 }}>{siteVacantCount}</span><span style={{ color:"#6b6b70" }}> vacants</span></span>
                <span><span style={{ color:LIME, fontWeight:700 }}>{formatCurrency(siteMonthlyRent)}</span><span style={{ color:"#6b6b70" }}>/mois</span></span>
                <span><span style={{ color:"#f3f3f4", fontWeight:700 }}>{site.total_surface} m²</span></span>
              </div>
            </div>

            {/* Plan interactif */}
            <div style={{ borderRadius:18, overflow:"hidden", border:"1px solid rgba(255,255,255,0.05)", marginBottom:14 }}>
              <BuildingPlan siteName={site.name} units={planUnits} />
            </div>

            {/* Table locataires */}
            {siteTenantCount>0 && (
              <div style={{ background:"linear-gradient(160deg,#1b1b1d,#141416)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:18, overflow:"hidden" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Locataire</th>
                      <th style={thStyle}>Unité</th>
                      <th style={{...thStyle, textAlign:"right"}}>Loyer/mois</th>
                      <th style={{...thStyle, textAlign:"center"}}>Paiement {currentMonth}</th>
                      <th style={{...thStyle, textAlign:"center"}}>Assurance</th>
                      <th style={{...thStyle, textAlign:"right"}}>Fin de bail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {planUnits.filter((u)=>u.status==="occupied"&&u.tenant).map((u)=>{
                      const t = u.tenant!;
                      const daysToEnd = t.lease_end?getDaysUntil(t.lease_end):null;
                      const isLeaseAlert = daysToEnd!==null&&daysToEnd<=90;
                      const payStyle = PAY_STYLE[t.payment_status]||PAY_STYLE.pending;
                      const insStyle = PAY_STYLE[t.insurance_status]||PAY_STYLE.missing;
                      return (
                        <tr key={u.id} style={{
                          background:(t.payment_status==="overdue"||t.insurance_status==="expired")?"rgba(239,68,68,0.04)":"transparent",
                        }}>
                          <td style={tdStyle}><span style={{ color:"#f3f3f4", fontSize:13, fontWeight:600 }}>{t.company_name}</span></td>
                          <td style={tdStyle}><span style={{ color:"#a3a3a8", fontSize:12 }}>{u.name}</span></td>
                          <td style={{...tdStyle, textAlign:"right"}}>
                            <span style={{ color:LIME, fontSize:13, fontWeight:700 }}>{formatCurrency(t.rent_amount)}</span>
                          </td>
                          <td style={{...tdStyle, textAlign:"center"}}>
                            <span style={{
                              display:"inline-flex", padding:"3px 10px", borderRadius:20,
                              background:payStyle.bg, color:payStyle.color, fontSize:11, fontWeight:600,
                            }}>{payStyle.label}</span>
                          </td>
                          <td style={{...tdStyle, textAlign:"center"}}>
                            <span style={{
                              display:"inline-flex", padding:"3px 10px", borderRadius:20,
                              background:insStyle.bg, color:insStyle.color, fontSize:11, fontWeight:600,
                            }}>{insStyle.label}</span>
                          </td>
                          <td style={{...tdStyle, textAlign:"right"}}>
                            {t.lease_end ? (
                              <div>
                                <p style={{ color:isLeaseAlert?"#fb923c":"#a3a3a8", fontSize:12, fontWeight:600 }}>
                                  {formatDate(t.lease_end)}
                                </p>
                                {isLeaseAlert && <p style={{ color:"#fb923c", fontSize:11 }}>dans {daysToEnd}j ⚠</p>}
                              </div>
                            ) : <span style={{ color:"#6b6b70", fontSize:12 }}>Indéterminé</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Lots vacants */}
            {siteVacantCount>0 && (
              <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginTop:10 }}>
                <span style={{ color:"#6b6b70", fontSize:11, fontWeight:600 }}>Lots vacants :</span>
                {siteUnits.filter((u)=>u.status==="vacant").map((u)=>(
                  <span key={u.id} style={{
                    fontSize:11, background:"rgba(255,255,255,0.05)", color:"#a3a3a8",
                    padding:"3px 10px", borderRadius:20, border:"1px solid rgba(255,255,255,0.08)",
                  }}>
                    {u.name} · {u.surface} m² · {u.monthly_rent?formatCurrency(u.monthly_rent):"—"}/mois
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Empty state */}
      {(!sites||sites.length===0) && (
        <div style={{
          background:"linear-gradient(160deg,#1b1b1d,#141416)",
          border:"1px dashed rgba(255,255,255,0.08)", borderRadius:18, padding:"48px 20px", textAlign:"center",
        }}>
          <div style={{ fontSize:32, marginBottom:10 }}>🏢</div>
          <p style={{ color:"#f3f3f4", fontSize:14, fontWeight:600 }}>Aucun site configuré</p>
          <p style={{ color:"#6b6b70", fontSize:12, marginTop:6 }}>
            Ajoutez vos sites immobiliers pour commencer le suivi.
          </p>
        </div>
      )}
    </div>
  );
}

function AlertBlock({ title, color, items }: {
  title: string; color: string;
  items: { label:string; sub:string; badge:string }[];
}) {
  return (
    <div style={{
      background:"linear-gradient(160deg,#1b1b1d,#141416)",
      border:`1px solid ${color}40`, borderRadius:18, overflow:"hidden",
    }}>
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"11px 16px", borderBottom:`1px solid ${color}30`,
        background:`${color}0d`,
      }}>
        <span style={{ color, fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:0.7 }}>{title}</span>
        <span style={{
          background:`${color}20`, color, fontSize:11, fontWeight:700,
          padding:"2px 8px", borderRadius:20,
        }}>{items.length}</span>
      </div>
      {items.map((item,i)=>(
        <div key={i} style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"11px 16px", borderBottom:i<items.length-1?"1px solid rgba(255,255,255,0.04)":"none",
        }}>
          <div>
            <p style={{ color:"#f3f3f4", fontSize:12, fontWeight:600 }}>{item.label}</p>
            <p style={{ color:"#6b6b70", fontSize:11, marginTop:2 }}>{item.sub}</p>
          </div>
          <span style={{
            fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20,
            background:`${color}20`, color,
          }}>{item.badge}</span>
        </div>
      ))}
    </div>
  
  );
}
