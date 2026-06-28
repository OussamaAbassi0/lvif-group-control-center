import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";

const LIME = "#C5F73A";

const COMPANY_DOT: Record<string,string> = {
  LVIF:"#C5F73A", ENO:"#a78bfa", TJM:"#34d399", SCI:"#f59e0b", HLD:"#94a3b8",
};

// ─── Déclarations Intermittents — Source: SUIVI FACTURE - DECLA INTERMITTENT.xlsx ───
// Mise à jour : 29/06/2026 — Qonto live | Total HT dû : 9 634,92 € | En retard : 7 700,25 €
const DECLA_INTERMITTENTS = [
  { societe:"Axel Carre",         event:"Test sol LED / Prépa",       montant:"72,00 €",    echeance:"24/06/2026", retard:true  },
  { societe:"Michael Guibert EI", event:"Stock",                      montant:"1 825,00 €", echeance:"24/06/2026", retard:true  },
  { societe:"I-RENT (Ilyes)",     event:"50 Ans Decathlon",           montant:"693,25 €",   echeance:"24/06/2026", retard:true  },
  { societe:"Amaury",             event:"Leaders Summit",             montant:"840,00 €",   echeance:"24/06/2026", retard:true  },
  { societe:"GRMP (Camille)",     event:"Leaders Summit",             montant:"1 160,00 €", echeance:"24/06/2026", retard:true  },
  { societe:"GRMP (Camille)",     event:"50 Ans Decathlon",           montant:"160,00 €",   echeance:"24/06/2026", retard:true  },
  { societe:"Josué Ngoie",        event:"Leaders Summit",             montant:"2 450,00 €", echeance:"24/06/2026", retard:true  },
  { societe:"Pump Society",       event:"Leaders Summit",             montant:"500,00 €",   echeance:"24/06/2026", retard:true  },
  { societe:"Pump Society",       event:"LVI - Parc de la Villette",  montant:"600,00 €",   echeance:"30/06/2026", retard:false },
  { societe:"Pump Society",       event:"Note de frais",              montant:"234,67 €",   echeance:"30/06/2026", retard:false },
  { societe:"Visions",            event:"Réalisateur / Cadreur",      montant:"700,00 €",   echeance:"30/06/2026", retard:false },
  { societe:"Enzo Fernet",        event:"Ramatuelle 15/06",           montant:"400,00 €",   echeance:"30/06/2026", retard:false },
];

// ─── Fetch Qonto live data (server-side) ───────────────────────────────────────
interface QontoAccount {
  slug: string; iban: string; bic: string; currency: string;
  balance_cents: number; authorized_balance_cents: number;
  name: string; bank_account_type?: string; updated_at: string;
}
interface QontoData {
  accounts: QontoAccount[];
  qonto_balance: number;
  bnp_balance: number;
  total: number;
  charges_fixes: number;
  error?: string;
}

async function fetchQonto(): Promise<QontoData | null> {
  const login  = process.env.QONTO_LOGIN;
  const secret = process.env.QONTO_SECRET_KEY;
  if (!login || !secret) return null;

  try {
    const res = await fetch("https://thirdparty.qonto.com/v2/organization", {
      headers: { Authorization: `${login}:${secret}`, "Content-Type": "application/json" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return { accounts:[], qonto_balance:0, bnp_balance:0, total:0, charges_fixes:25577, error:`HTTP ${res.status}` };

    const data = await res.json();
    const accounts: QontoAccount[] = data.organization?.bank_accounts ?? [];

    const bnpAccounts = accounts.filter(
      (a) => a.bank_account_type === "external" || (a.name ?? "").toLowerCase().includes("bnp")
    );
    const qontoAccounts = accounts.filter(
      (a) => !bnpAccounts.includes(a)
    );

    const qontoBalance = qontoAccounts.reduce((s,a) => s + (a.balance_cents ?? 0) / 100, 0);
    const bnpBalance   = bnpAccounts.reduce((s,a)   => s + (a.balance_cents ?? 0) / 100, 0);

    // Charges fixes = Dépenses structurelles + Frais bancaires (Qonto Trésorerie > Prévision, Juin 2026)
    const CHARGES_FIXES = 25577;

    return { accounts, qonto_balance: qontoBalance, bnp_balance: bnpBalance, total: qontoBalance + bnpBalance, charges_fixes: CHARGES_FIXES };
  } catch {
    return { accounts:[], qonto_balance:0, bnp_balance:0, total:0, charges_fixes:25577, error:"Fetch failed" };
  }
}

export default async function FinancePage() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  // Fetch Qonto & Supabase in parallel
  const [qonto, accountsResult, receivableResult, payableResult] = await Promise.all([
    fetchQonto(),
    supabase.from("bank_accounts").select("*, companies(name, short_name, color)").order("balance", { ascending: false }),
    supabase.from("invoices").select("amount, status, due_date, counterparty, companies(short_name)").eq("type","receivable").neq("status","paid").order("due_date",{ascending:true}),
    supabase.from("invoices").select("amount, status, due_date, counterparty, companies(short_name)").eq("type","payable").neq("status","paid").order("due_date",{ascending:true}),
  ]);

  const accounts = accountsResult.data;
  const receivable = receivableResult.data;
  const payable = payableResult.data;

  const totalCash        = accounts?.reduce((s,a)=>s+(a.balance||0),0)||0;
  const totalReceivable  = receivable?.reduce((s,i)=>s+(i.amount||0),0)||0;
  const totalPayable     = payable?.reduce((s,i)=>s+(i.amount||0),0)||0;
  const overduePayable   = payable?.filter((i)=>i.due_date&&i.due_date<today)??[];
  const totalOverdue     = overduePayable.reduce((s,i)=>s+(i.amount||0),0);

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

  const fmt = (n: number) => n.toLocaleString("fr-FR", { style:"currency", currency:"EUR", minimumFractionDigits:2 });

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

      {/* ── Trésorerie Live — Qonto ── */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
          <p style={{ color:"#6b6b70", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:1 }}>
            Trésorerie — Live Qonto
          </p>
          {qonto && !qonto.error && (
            <span style={{ background:"rgba(197,247,58,0.12)", color:LIME, fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20, letterSpacing:0.5 }}>
              ● LIVE
            </span>
          )}
          {qonto?.error && (
            <span style={{ background:"rgba(239,68,68,0.12)", color:"#f87171", fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20 }}>
              ⚠ {qonto.error}
            </span>
          )}
        </div>

        {qonto ? (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
            {[
              { label:"Solde Qonto",   value: fmt(qonto.qonto_balance), sub:"Compte principal Qonto",        lime:true,  alert:false },
              { label:"Solde BNP",     value: fmt(qonto.bnp_balance),   sub:"Compte BNP connecté",           lime:false, alert:false },
              { label:"Total tréso",   value: fmt(qonto.total),         sub:"Qonto + BNP consolidé",         lime:true,  alert:false },
              { label:"Charges fixes", value: fmt(qonto.charges_fixes), sub:"Dép. struct. + Remb. prêts",    lime:false, alert:true  },
            ].map((k)=>(
              <div key={k.label} style={{
                ...card,
                borderColor:k.alert?"rgba(239,68,68,0.25)":"rgba(255,255,255,0.05)",
                display:"flex", flexDirection:"column", gap:6,
              }}>
                <span style={{ color:"#6b6b70", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:0.8 }}>{k.label}</span>
                <span style={{ color:k.alert?"#f87171":k.lime?LIME:"#f3f3f4", fontSize:22, fontWeight:700, letterSpacing:-0.5 }}>{k.value}</span>
                <span style={{ color:"#6b6b70", fontSize:11 }}>{k.sub}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ ...card, padding:"18px 22px", borderColor:"rgba(255,255,255,0.04)" }}>
            <p style={{ color:"#6b6b70", fontSize:12 }}>
              Clés API Qonto non configurées — ajoutez <code style={{ color:LIME }}>QONTO_LOGIN</code> et <code style={{ color:LIME }}>QONTO_SECRET_KEY</code> dans les variables d&apos;environnement Vercel.
            </p>
          </div>
        )}

        {/* Détail des comptes Qonto */}
        {qonto && qonto.accounts.length > 0 && (
          <div style={{ ...card, padding:0, overflow:"hidden", marginTop:12 }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Compte</th>
                  <th style={thStyle}>IBAN</th>
                  <th style={thStyle}>Type</th>
                  <th style={{...thStyle,textAlign:"right"}}>Solde</th>
                </tr>
              </thead>
              <tbody>
                {qonto.accounts.map((acc) => (
                  <tr key={acc.slug}>
                    <td style={tdStyle}><span style={{ color:"#f3f3f4", fontSize:13, fontWeight:600 }}>{acc.name || acc.slug}</span></td>
                    <td style={tdStyle}><span style={{ color:"#a3a3a8", fontSize:12, fontFamily:"monospace" }}>{acc.iban?.replace(/(.{4})/g,"$1 ").trim() || "—"}</span></td>
                    <td style={tdStyle}>
                      <span style={{
                        display:"inline-flex", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600,
                        background:acc.bank_account_type==="external"?"rgba(234,179,8,0.12)":"rgba(197,247,58,0.10)",
                        color:acc.bank_account_type==="external"?"#fde68a":LIME,
                      }}>
                        {acc.bank_account_type==="external"?"Externe":"Qonto"}
                      </span>
                    </td>
                    <td style={{...tdStyle,textAlign:"right"}}>
                      <span style={{ color:"#f3f3f4", fontSize:14, fontWeight:700 }}>{fmt((acc.balance_cents ?? 0) / 100)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── KPIs Supabase (factures) ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:20 }}>
        {[
          { label:"À encaisser (clients)",  value:formatCurrency(totalReceivable),  sub:`${receivable?.length||0} facture(s) en cours`, alert:false },
          { label:"À payer (fournisseurs)", value:formatCurrency(totalPayable),     sub:`${payable?.length||0} facture(s) à régler`,    alert:totalPayable>0 },
          { label:"Paiements en retard",    value:formatCurrency(totalOverdue),     sub:`${overduePayable.length} facture(s) échues`,    alert:overduePayable.length>0 },
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

      {/* ── Déclarations Intermittents ── */}
      <div style={{ marginBottom:24 }}>
        <p style={{ color:"#6b6b70", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:12 }}>
          Déclarations Intermittents — Suivi Facture
        </p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:14 }}>
          {([
            { label:"Total HT dû",    value:"9 634,92 €", sub:"12 factures en attente",       alert:false },
            { label:"Dont en retard", value:"7 700,25 €", sub:"8 factures — éch. 24/06/2026", alert:true  },
            { label:"À venir",        value:"1 934,67 €", sub:"4 factures — éch. 30/06/2026", alert:false },
          ] as const).map((k)=>(
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
                  <th style={{...thStyle,textAlign:"right"}}>Montant</th>
                  <th style={{...thStyle,textAlign:"right"}}>Échéance</th>
                </tr>
              </thead>
              <tbody>
                {payable!.map((inv,i)=>{
                  const isLate = inv.due_date&&inv.due_date<today;
                  return (
                    <tr key={i} style={{ background:isLate?"rgba(239,68,68,0.04)":"transparent" }}>
                      <td style={tdStyle}><span style={{ color:"#f3f3f4", fontSize:13, fontWeight:600 }}>{inv.counterparty}</span></td>
                      <td style={tdStyle}><span style={{ color:"#a3a3a8", fontSize:11, fontWeight:600 }}>{(inv.companies as {short_name:string}|null)?.short_name||"—"}</span></td>
                      <td style={tdStyle}>
                        <span style={{
                          display:"inline-flex", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600,
                          background:isLate?"rgba(239,68,68,0.15)":"rgba(234,179,8,0.15)",
                          color:isLate?"#fca5a5":"#fde68a",
                        }}>
                          {isLate?"En retard":"En attente"}
                        </span>
                      </td>
                      <td style={{...tdStyle,textAlign:"right"}}><span style={{ color:"#f3f3f4", fontSize:13, fontWeight:700 }}>{formatCurrency(inv.amount)}</span></td>
                      <td style={{...tdStyle,textAlign:"right"}}><span style={{ color:isLate?"#f87171":"#8b8b8f", fontSize:11, fontWeight:600 }}>{inv.due_date?formatDate(inv.due_date):"—"}</span></td>
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
                  <th style={{...thStyle,textAlign:"right"}}>Montant</th>
                  <th style={{...thStyle,textAlign:"right"}}>Échéance</th>
                </tr>
              </thead>
              <tbody>
                {receivable!.map((inv,i)=>{
                  const isLate = inv.due_date&&inv.due_date<today;
                  return (
                    <tr key={i} style={{ background:isLate?"rgba(239,68,68,0.04)":"transparent" }}>
                      <td style={tdStyle}><span style={{ color:"#f3f3f4", fontSize:13, fontWeight:600 }}>{inv.counterparty}</span></td>
                      <td style={tdStyle}><span style={{ color:"#a3a3a8", fontSize:11, fontWeight:600 }}>{(inv.companies as {short_name:string}|null)?.short_name||"—"}</span></td>
                      <td style={tdStyle}>
                        <span style={{
                          display:"inline-flex", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600,
                          background:isLate?"rgba(239,68,68,0.15)":"rgba(197,247,58,0.12)",
                          color:isLate?"#fca5a5":LIME,
                        }}>
                          {isLate?"En retard":"À encaisser"}
                        </span>
                      </td>
                      <td style={{...tdStyle,textAlign:"right"}}><span style={{ color:LIME, fontSize:13, fontWeight:700 }}>{formatCurrency(inv.amount)}</span></td>
                      <td style={{...tdStyle,textAlign:"right"}}><span style={{ color:isLate?"#f87171":"#8b8b8f", fontSize:11, fontWeight:600 }}>{inv.due_date?formatDate(inv.due_date):"—"}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
