import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";

const LIME = "#C5F73A";

const COMPANY_DOT: Record<string,string> = {
  LVIF:"#C5F73A", ENO:"#a78bfa", TJM:"#34d399", SCI:"#f59e0b", HLD:"#94a3b8",
};

export default async function FinancePage() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: accounts } = await supabase
    .from("bank_accounts")
    .select("*, companies(name, short_name, color)")
    .order("balance", { ascending: false });

  const totalCash = accounts?.reduce((s,a)=>s+(a.balance||0),0)||0;

  const { data: receivable } = await supabase
    .from("invoices")
    .select("amount, status, due_date, counterparty, companies(short_name)")
    .eq("type","receivable").neq("status","paid")
    .order("due_date",{ascending:true});

  const totalReceivable = receivable?.reduce((s,i)=>s+(i.amount||0),0)||0;

  const { data: payable } = await supabase
    .from("invoices")
    .select("amount, status, due_date, counterparty, companies(short_name)")
    .eq("type","payable").neq("status","paid")
    .order("due_date",{ascending:true});

  const totalPayable = payable?.reduce((s,i)=>s+(i.amount||0),0)||0;
  const overduePayable = payable?.filter((i)=>i.due_date&&i.due_date<today)??[];
  const totalOverdue = overduePayable.reduce((s,i)=>s+(i.amount||0),0);

  const card = {
    background:"linear-gradient(160deg,#1b1b1d,#141416)",
    border:"1px solid rgba(255,255,255,0.05)", borderRadius:22, padding:"20px 22px",
  } as const;
  const thStyle = {
    textAlign:"left" as const, padding:"12px 18px",
    color:"#6b6b70", fontSize:11, fontWeight:600,
    textTransform:"uppercase" as const, letterSpacing:0.7,
    borderBottom:"1px solid rgba(255,255,255,0.05)",
  };
  const tdStyle = {
    padding:"13px 18px", borderBottom:"1px solid rgba(255,255,255,0.04)",
    verticalAlign:"middle" as const,
  };

  return (
    <div style={{ padding:"28px 24px", background:"#0c0c0d", minHeight:"100vh" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom:26 }}>
        <p style={{ color:"#6b6b70", fontSize:12, fontWeight:600, textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>
          LVIF Group — Module
        </p>
        <h1 style={{ color:"#f3f3f4", fontSize:26, fontWeight:700, letterSpacing:-0.5 }}>Finance</h1>
        <p style={{ color:"#6b6b70", fontSize:13, marginTop:5 }}>
          Trésorerie, factures et flux financiers du groupe
        </p>
      </div>

      {/* ── KPIs ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:20 }}>
        {[
          { label:"Trésorerie groupe", value:formatCurrency(totalCash), sub:"Tous comptes consolidés", lime:true },
          { label:"À encaisser (clients)", value:formatCurrency(totalReceivable), sub:`${receivable?.length||0} facture(s) en cours`, alert:false },
          { label:"À payer (fournisseurs)", value:formatCurrency(totalPayable), sub:`${payable?.length||0} facture(s) à régler`, alert:totalPayable>0 },
          { label:"Paiements en retard", value:formatCurrency(totalOverdue), sub:`${overduePayable.length} facture(s) échues`, alert:overduePayable.length>0 },
        ].map((k)=>(
          <div key={k.label} style={{
            ...card,
            borderColor: k.alert?"rgba(239,68,68,0.3)":"rgba(255,255,255,0.05)",
            display:"flex", flexDirection:"column", gap:6,
          }}>
            <span style={{ color:"#6b6b70", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:0.8 }}>{k.label}</span>
            <span style={{ color:k.alert?"#f87171":k.lime?LIME:"#f3f3f4", fontSize:22, fontWeight:700, letterSpacing:-0.5 }}>{k.value}</span>
            <span style={{ color:"#6b6b70", fontSize:11 }}>{k.sub}</span>
          </div>
        ))}
      </div>


      {/* ── Déclarations Intermittents ── */}
      <div style={{ marginBottom:24 }}>
        <p style={{ color:"#6b6b70", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:12 }}>
          Déclarations Intermittents — SUIVI FACTURE
        </p>
        {/* Mini KPIs */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:14 }}>
          {[
            { label:"Total HT dû",      value:"9 634,92 €",  sub:"12 factures en attente",          alert:false, lime:false },
            { label:"Dont en retard",   value:"7 700,25 €",  sub:"8 factures — éch. 24/06/2026",    alert:true,  lime:false },
            { label:"À venir",          value:"1 934,67 €",  sub:"4 factures — éch. 30/06/2026",    alert:false, lime:false },
          ].map((k)=>(
            <div key={k.label} style={{
              ...card,
              borderColor:k.alert?"rgba(239,68,68,0.3)":"rgba(255,255,255,0.05)",
              display:"flex", flexDirection:"column", gap:6,
            }}>
              <span style={{ color:"#6b6b70", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:0.8 }}>{k.label}</span>
              <span style={{ color:k.alert?"#f87171":"#f3f3f4", fontSize:22, fontWeight:700, letterSpacing:-0.5 }}>{k.value}</span>
              <span style={{ color:"#6b6b70", fontSize:11 }}>{k.sub}</span>
            </div>
          ))}
        </div>
        {/* Détail table */}
        <div style={{ ...card, padding:0, overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Intermittent</th>
                <th style={thStyle}>Événement</th>
                <th style={thStyle}>Statut</th>
                <th style={{...thStyle,textAlign:"right"}}>Montant HT</th>
                <th style={{...thStyle,textAlign:"right"}}>Échéance</th>
              </tr>
            </thead>
            <tbody>
              {DECLA_INTERMITTENTS.map((row,i)=>(
                <tr key={i} style={{ background:row.retard?"rgba(239,68,68,0.04)":"transparent" }}>
                  <td style={tdStyle}><span style={{ color:"#f3f3f4", fontSize:13, fontWeight:600 }}>{row.societe}</span></td>
                  <td style={tdStyle}><span style={{ color:"#a3a3a8", fontSize:12 }}>{row.event}</span></td>
                  <td style={tdStyle}>
                    <span style={{
                      display:"inline-flex", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600,
                      background:row.retard?"rgba(239,68,68,0.15)":"rgba(234,179,8,0.15)",
                      color:row.retard?"#fca5a5":"#fde68a",
                    }}>
                      {row.retard?"En retard":"À venir"}
                    </span>
                  </td>
                  <td style={{...tdStyle,textAlign:"right"}}>
                    <span style={{ color:row.retard?"#f87171":"#f3f3f4", fontSize:13, fontWeight:700 }}>{row.montant}</span>
                  </td>
                  <td style={{...tdStyle,textAlign:"right"}}>
                    <span style={{ color:row.retard?"#f87171":"#8b8b8f", fontSize:11, fontWeight:600 }}>{row.echeance}</span>
                  </td>
                </tr>
              ))}
              {/* Total row */}
              <tr style={{ background:"rgba(255,255,255,0.02)" }}>
                <td colSpan={3} style={{...tdStyle,borderBottom:"none"}}>
                  <span style={{ color:"#e9e9ea", fontSize:12, fontWeight:700 }}>Total HT dû</span>
                </td>
                <td style={{...tdStyle,textAlign:"right",borderBottom:"none"}}>
                  <span style={{ color:"#f3f3f4", fontSize:14, fontWeight:700 }}>9 634,92 €</span>
                </td>
                <td style={{...tdStyle,borderBottom:"none"}} />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Comptes bancaires ── */}
      <div style={{ marginBottom:20 }}>
        <p style={{ color:"#6b6b70", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>
          Comptes bancaires
        </p>
        {accounts&&accounts.length>0 ? (
          <div style={{ ...card, padding:0, overflow:"hidden" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Société</th>
                  <th style={thStyle}>Banque</th>
                  <th style={thStyle}>Compte</th>
                  <th style={{...thStyle, textAlign:"right"}}>Solde</th>
                  <th style={{...thStyle, textAlign:"right"}}>Mis à jour</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account)=>{
                  const shortName = (account.companies as {short_name:string}|null)?.short_name||"";
                  const dot = COMPANY_DOT[shortName]||"#6b6b70";
                  return (
                    <tr key={account.id}>
                      <td style={tdStyle}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ width:8, height:8, borderRadius:"50%", background:dot, display:"inline-block", flexShrink:0 }} />
                          <span style={{ color:"#f3f3f4", fontSize:13, fontWeight:600 }}>
                            {(account.companies as {name:string}|null)?.name||"—"}
                          </span>
                        </div>
                      </td>
                      <td style={tdStyle}><span style={{ color:"#a3a3a8", fontSize:12 }}>{account.bank_name}</span></td>
                      <td style={tdStyle}><span style={{ color:"#a3a3a8", fontSize:12 }}>{account.account_name}</span></td>
                      <td style={{...tdStyle, textAlign:"right"}}>
                        <span style={{ color:account.balance>=0?"#f3f3f4":"#f87171", fontSize:14, fontWeight:700 }}>
                          {formatCurrency(account.balance)}
                        </span>
                      </td>
                      <td style={{...tdStyle, textAlign:"right"}}>
                        <span style={{ color:"#6b6b70", fontSize:11 }}>
                          {account.updated_at?formatDate(account.updated_at):"—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {/* Total row */}
                <tr style={{ background:"rgba(197,247,58,0.04)" }}>
                  <td colSpan={3} style={{...tdStyle, borderBottom:"none"}}>
                    <span style={{ color:"#e9e9ea", fontSize:13, fontWeight:700 }}>Total consolidé</span>
                  </td>
                  <td style={{...tdStyle, textAlign:"right", borderBottom:"none"}}>
                    <span style={{ color:LIME, fontSize:16, fontWeight:700 }}>{formatCurrency(totalCash)}</span>
                  </td>
                  <td style={{...tdStyle, borderBottom:"none"}} />
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState text="Les données bancaires apparaîtront ici après connexion Qonto / Pennylane / BNP." />
        )}
      </div>

      {/* ── Factures fournisseurs ── */}
      {(payable?.length||0)>0 && (
        <div style={{ marginBottom:20 }}>
          <p style={{ color:"#6b6b70", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>
            Factures fournisseurs à régler
          </p>
          <div style={{ ...card, padding:0, overflow:"hidden" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Fournisseur</th>
                  <th style={thStyle}>Société</th>
                  <th style={thStyle}>Statut</th>
                  <th style={{...thStyle, textAlign:"right"}}>Montant</th>
                  <th style={{...thStyle, textAlign:"right"}}>Échéance</th>
                </tr>
              </thead>
              <tbody>
                {payable!.map((inv,i)=>{
                  const isLate = inv.due_date&&inv.due_date<today;
                  return (
                    <tr key={i} style={{ background:isLate?"rgba(239,68,68,0.04)":"transparent" }}>
                      <td style={tdStyle}><span style={{ color:"#f3f3f4", fontSize:13, fontWeight:600 }}>{inv.counterparty}</span></td>
                      <td style={tdStyle}>
                        <span style={{ color:"#a3a3a8", fontSize:11, fontWeight:600 }}>
                          {(inv.companies as {short_name:string}|null)?.short_name||"—"}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          display:"inline-flex", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600,
                          background:isLate?"rgba(239,68,68,0.15)":"rgba(234,179,8,0.15)",
                          color:isLate?"#fca5a5":"#fde68a",
                        }}>
                          {isLate?"En retard":"En attente"}
                        </span>
                      </td>
                      <td style={{...tdStyle, textAlign:"right"}}>
                        <span style={{ color:"#f3f3f4", fontSize:13, fontWeight:700 }}>{formatCurrency(inv.amount)}</span>
                      </td>
                      <td style={{...tdStyle, textAlign:"right"}}>
                        <span style={{ color:isLate?"#f87171":"#8b8b8f", fontSize:11, fontWeight:600 }}>
                          {inv.due_date?formatDate(inv.due_date):"—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Factures clients ── */}
      {(receivable?.length||0)>0 && (
        <div style={{ marginBottom:20 }}>
          <p style={{ color:"#6b6b70", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>
            Factures clients à encaisser
          </p>
          <div style={{ ...card, padding:0, overflow:"hidden" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Client</th>
                  <th style={thStyle}>Société</th>
                  <th style={thStyle}>Statut</th>
                  <th style={{...thStyle, textAlign:"right"}}>Montant</th>
                  <th style={{...thStyle, textAlign:"right"}}>Échéance</th>
                </tr>
              </thead>
              <tbody>
                {receivable!.map((inv,i)=>{
                  const isLate = inv.due_date&&inv.due_date<today;
                  return (
                    <tr key={i} style={{ background:isLate?"rgba(239,68,68,0.04)":"transparent" }}>
                      <td style={tdStyle}><span style={{ color:"#f3f3f4", fontSize:13, fontWeight:600 }}>{inv.counterparty}</span></td>
                      <td style={tdStyle}>
                        <span style={{ color:"#a3a3a8", fontSize:11, fontWeight:600 }}>
                          {(inv.companies as {short_name:string}|null)?.short_name||"—"}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          display:"inline-flex", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600,
                          background:isLate?"rgba(239,68,68,0.15)":"rgba(197,247,58,0.12)",
                          color:isLate?"#fca5a5":"#c5f73a",
                        }}>
                          {isLate?"En retard":"À encaisser"}
                        </span>
                      </td>
                      <td style={{...tdStyle, textAlign:"right"}}>
                        <span style={{ color:LIME, fontSize:13, fontWeight:700 }}>{formatCurrency(inv.amount)}</span>
                      </td>
                      <td style={{...tdStyle, textAlign:"right"}}>
                        <span style={{ color:isLate?"#f87171":"#8b8b8f", fontSize:11, fontWeight:600 }}>
                          {inv.due_date?formatDate(inv.due_date):"—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state if no accounts and no invoices */}
      {(!accounts||accounts.length===0)&&(receivable?.length||0)===0&&(payable?.length||0)===0 && (
        <EmptyState text="Les données financières apparaîtront ici après connexion Qonto / Pennylane / BNP." />
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div style={{
      background:"linear-gradient(160deg,#1b1b1d,#141416)",
      border:"1px dashed rgba(255,255,255,0.08)", borderRadius:18,
      padding:"40px 20px", textAlign:"center",
    }}>
      <div style={{ fontSize:32, marginBottom:10 }}>🏦</div>
      <p style={{ color:"#f3f3f4", fontSize:14, fontWeight:600, marginBottom:6 }}>Données en attente</p>
      <p style={{ color:"#6b6b70", fontSize:12 }}>{text}</p>
    </div>
  );
}
