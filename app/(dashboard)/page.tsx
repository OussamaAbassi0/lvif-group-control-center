import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import {
  TrendingUp,
  Wallet,
  AlertTriangle,
  Building2,
  TrendingDown,
  CheckCircle2,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";

const COMPANY_COLORS: Record<string, { dot: string; bar: string }> = {
  LVIF: { dot: "bg-brand-600",   bar: "bg-brand-500" },
  ENO:  { dot: "bg-violet-600",  bar: "bg-violet-500" },
  TJM:  { dot: "bg-emerald-600", bar: "bg-emerald-500" },
  SCI:  { dot: "bg-amber-600",   bar: "bg-amber-500" },
  HLD:  { dot: "bg-gray-600",    bar: "bg-gray-500" },
};

const STATUS_PIPELINE = [
  { key: "prospect",      label: "Prospect",     color: "bg-gray-200" },
  { key: "qualification", label: "Qualification", color: "bg-blue-300" },
  { key: "proposition",   label: "Proposition",  color: "bg-yellow-300" },
  { key: "negociation",   label: "Négociation",  color: "bg-orange-300" },
  { key: "gagne",         label: "Gagné",        color: "bg-emerald-400" },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const currentMonth = new Date().toISOString().slice(0, 7);

  // ---- Trésorerie par société ----
  const { data: accounts } = await supabase
    .from("bank_accounts")
    .select("balance, bank_name, account_name, updated_at, company_id, companies(short_name, name, color)")
    .order("balance", { ascending: false });

  const totalCash = accounts?.reduce((s, a) => s + (a.balance ?? 0), 0) ?? 0;

  // Grouper par société
  const cashBySociety: Record<string, { name: string; short: string; total: number; color: string }> = {};
  for (const a of accounts ?? []) {
    const co = a.companies as { short_name: string; name: string; color: string } | null;
    if (!co) continue;
    if (!cashBySociety[co.short_name]) {
      cashBySociety[co.short_name] = { name: co.name, short: co.short_name, total: 0, color: co.color };
    }
    cashBySociety[co.short_name].total += a.balance ?? 0;
  }
  const cashSocieties = Object.values(cashBySociety).sort((a, b) => b.total - a.total);
  const maxBalance = Math.max(...cashSocieties.map((c) => c.total), 1);

  // ---- Deals pipeline ----
  const { data: allDeals } = await supabase
    .from("deals")
    .select("id, amount, status, next_action_date, companies(short_name)");

  const overdueDeals = allDeals?.filter(
    (d) =>
      d.next_action_date &&
      d.next_action_date < today &&
      !["gagne", "perdu"].includes(d.status)
  ) ?? [];

  const activeDeals = allDeals?.filter((d) => !["gagne", "perdu"].includes(d.status)) ?? [];
  const totalPipeline = activeDeals.reduce((s, d) => s + (d.amount ?? 0), 0);

  // Pipeline par statut
  const pipelineByStatus = STATUS_PIPELINE.map((s) => {
    const deals = activeDeals.filter((d) => d.status === s.key);
    const amount = deals.reduce((sum, d) => sum + (d.amount ?? 0), 0);
    return { ...s, count: deals.length, amount };
  });

  // ---- Factures ----
  const { data: invoices } = await supabase
    .from("invoices")
    .select("amount, type, status, due_date")
    .neq("status", "paid");

  const totalReceivable = invoices?.filter((i) => i.type === "receivable").reduce((s, i) => s + (i.amount ?? 0), 0) ?? 0;
  const totalPayable = invoices?.filter((i) => i.type === "payable").reduce((s, i) => s + (i.amount ?? 0), 0) ?? 0;
  const overdueInvoices = invoices?.filter((i) => i.due_date && i.due_date < today) ?? [];

  // ---- Immobilier ----
  const { data: units } = await supabase.from("units").select("status");
  const occupiedUnits = units?.filter((u) => u.status === "occupied").length ?? 0;
  const totalUnits = units?.length ?? 0;
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  const { data: overdueRents } = await supabase
    .from("rent_payments")
    .select("id, tenant_id, tenants(company_name)")
    .eq("status", "overdue")
    .eq("month", currentMonth);

  const { data: alertDocs } = await supabase
    .from("tenant_documents")
    .select("id, type, status, tenants(company_name)")
    .in("status", ["expired", "missing", "expiring_soon"])
    .eq("type", "insurance");

  const dateStr = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      <Header
        title="Vue d'ensemble"
        subtitle={`Groupe LVIF — ${dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}`}
      />

      <div className="p-6 space-y-6">

        {/* ============ TOP ROW : 4 KPIs critiques ============ */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            title="Trésorerie groupe"
            value={formatCurrency(totalCash)}
            icon={Wallet}
            iconColor="text-brand-600"
            subtitle="Consolidée toutes sociétés"
          />
          <KpiCard
            title="Pipeline commercial"
            value={formatCurrency(totalPipeline)}
            icon={TrendingUp}
            iconColor="text-violet-600"
            subtitle={`${activeDeals.length} opportunités actives`}
          />
          <KpiCard
            title="À encaisser clients"
            value={formatCurrency(totalReceivable)}
            icon={TrendingUp}
            iconColor="text-emerald-600"
            subtitle="Factures en cours"
          />
          <KpiCard
            title="À payer fournisseurs"
            value={formatCurrency(totalPayable)}
            icon={TrendingDown}
            iconColor={totalPayable > 10000 ? "text-red-600" : "text-orange-500"}
            alert={overdueInvoices.length > 0}
            subtitle={overdueInvoices.length > 0 ? `${overdueInvoices.length} facture(s) en retard !` : "Aucun retard"}
          />
        </div>

        {/* ============ 2 colonnes : Trésorerie + Pipeline ============ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Trésorerie par société */}
          <section className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">Trésorerie par société</h2>
              <span className="text-xs text-gray-400 font-mono">{formatCurrency(totalCash)}</span>
            </div>
            <div className="space-y-3">
              {cashSocieties.map((c) => {
                const pct = totalCash > 0 ? (c.total / totalCash) * 100 : 0;
                const barColor = COMPANY_COLORS[c.short]?.bar ?? "bg-gray-400";
                return (
                  <div key={c.short}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="flex items-center gap-2">
                        <span className={cn("w-2 h-2 rounded-full", COMPANY_COLORS[c.short]?.dot ?? "bg-gray-400")} />
                        <span className="font-medium text-gray-800">{c.short}</span>
                        <span className="text-gray-400">{c.name}</span>
                      </span>
                      <span className="font-semibold text-gray-900">{formatCurrency(c.total)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", barColor)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Pipeline commercial */}
          <section className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">Pipeline par étape</h2>
              <span className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                overdueDeals.length > 0 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"
              )}>
                {overdueDeals.length > 0 ? `${overdueDeals.length} en retard !` : "À jour"}
              </span>
            </div>
            <div className="space-y-2">
              {pipelineByStatus.map((s) => {
                const pct = totalPipeline > 0 ? (s.amount / totalPipeline) * 100 : 0;
                return (
                  <div key={s.key} className="flex items-center gap-3 text-xs">
                    <span className="w-20 text-gray-600 text-right shrink-0">{s.label}</span>
                    <div className="flex-1 h-6 bg-gray-50 rounded-md overflow-hidden relative border border-gray-100">
                      <div
                        className={cn("h-full rounded-md transition-all flex items-center px-2", s.color)}
                        style={{ width: `${Math.max(pct, s.count > 0 ? 8 : 0)}%` }}
                      >
                        {s.count > 0 && (
                          <span className="text-[10px] font-semibold text-gray-700 whitespace-nowrap">
                            {s.count} deal{s.count > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="w-20 text-right font-medium text-gray-700 shrink-0">
                      {s.amount > 0 ? formatCurrency(s.amount) : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* ============ Alertes & Immobilier ============ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Alertes urgentes */}
          <section className="bg-white rounded-xl border p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Alertes à traiter
            </h2>
            {overdueDeals.length === 0 && overdueRents?.length === 0 && overdueInvoices.length === 0 && alertDocs?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
                <p className="text-sm text-gray-500 font-medium">Aucune alerte active</p>
                <p className="text-xs text-gray-400 mt-0.5">Tout est à jour 🎉</p>
              </div>
            ) : (
              <div className="space-y-2">
                {overdueDeals.length > 0 && (
                  <AlertRow
                    icon="🔴"
                    label={`${overdueDeals.length} action${overdueDeals.length > 1 ? "s" : ""} commerciale${overdueDeals.length > 1 ? "s" : ""} en retard`}
                    sub="→ Module Commercial"
                    severity="red"
                  />
                )}
                {(overdueRents?.length ?? 0) > 0 && (
                  <AlertRow
                    icon="🔴"
                    label={`${overdueRents!.length} loyer${(overdueRents?.length ?? 0) > 1 ? "s" : ""} impayé${(overdueRents?.length ?? 0) > 1 ? "s" : ""} ce mois`}
                    sub="→ Module Immobilier"
                    severity="red"
                  />
                )}
                {overdueInvoices.length > 0 && (
                  <AlertRow
                    icon="🟠"
                    label={`${overdueInvoices.length} facture${overdueInvoices.length > 1 ? "s" : ""} fournisseur en retard`}
                    sub="→ Module Finance"
                    severity="orange"
                  />
                )}
                {(alertDocs?.length ?? 0) > 0 && (
                  <AlertRow
                    icon="🟡"
                    label={`${alertDocs!.length} assurance${(alertDocs?.length ?? 0) > 1 ? "s" : ""} à régulariser`}
                    sub="→ Module Immobilier"
                    severity="yellow"
                  />
                )}
              </div>
            )}
          </section>

          {/* Immobilier snapshot */}
          <section className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-600" />
                Immobilier — SCI Maya
              </h2>
              <span className="text-xs font-semibold text-brand-600">
                {occupancyRate}% occupé
              </span>
            </div>

            {/* Progress bar occupation */}
            <div className="mb-4">
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all"
                  style={{ width: `${occupancyRate}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{occupiedUnits} unités occupées</span>
                <span>{totalUnits - occupiedUnits} vacantes</span>
              </div>
            </div>

            {/* Loyers et alertes */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                <p className="text-gray-500 mb-0.5">Loyers mensuels</p>
                <p className="font-bold text-emerald-700 text-base">
                  Voir Immobilier
                </p>
              </div>
              <div className={cn(
                "rounded-lg p-3 border",
                (overdueRents?.length ?? 0) > 0
                  ? "bg-red-50 border-red-100"
                  : "bg-gray-50 border-gray-100"
              )}>
                <p className="text-gray-500 mb-0.5">Loyers impayés</p>
                <p className={cn("font-bold text-base", (overdueRents?.length ?? 0) > 0 ? "text-red-600" : "text-gray-700")}>
                  {overdueRents?.length ?? 0} locataire{(overdueRents?.length ?? 0) > 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* ============ Tableau trésorerie détaillé ============ */}
        {accounts && accounts.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Détail comptes bancaires
            </h2>
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Société</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Banque</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Compte</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-600">Solde</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-600">Mis à jour</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((a, i) => {
                    const co = a.companies as { short_name: string; name: string } | null;
                    return (
                      <tr key={i} className="border-b last:border-0 hover:bg-gray-50/30">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className={cn("w-2 h-2 rounded-full", COMPANY_COLORS[co?.short_name ?? ""]?.dot ?? "bg-gray-300")} />
                            <span className="font-medium text-gray-800">{co?.short_name}</span>
                            <span className="text-xs text-gray-400 hidden xl:inline">{co?.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-gray-600">{a.bank_name}</td>
                        <td className="px-5 py-3 text-gray-500 text-xs">{a.account_name}</td>
                        <td className={cn("px-5 py-3 text-right font-bold", a.balance >= 0 ? "text-gray-900" : "text-red-600")}>
                          {formatCurrency(a.balance)}
                        </td>
                        <td className="px-5 py-3 text-right text-xs text-gray-400">
                          {a.updated_at ? new Date(a.updated_at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-gray-50 border-t-2">
                    <td colSpan={3} className="px-5 py-3 font-semibold text-gray-900">Total consolidé groupe</td>
                    <td className="px-5 py-3 text-right font-bold text-lg text-brand-700">{formatCurrency(totalCash)}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function AlertRow({
  icon,
  label,
  sub,
  severity,
}: {
  icon: string;
  label: string;
  sub: string;
  severity: "red" | "orange" | "yellow";
}) {
  const colors = {
    red:    "bg-red-50 border-red-200 text-red-800",
    orange: "bg-orange-50 border-orange-200 text-orange-800",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-800",
  };
  return (
    <div className={cn("flex items-center justify-between px-3 py-2.5 rounded-lg border text-xs", colors[severity])}>
      <span className="flex items-center gap-2">
        <span>{icon}</span>
        <span className="font-medium">{label}</span>
      </span>
      <span className="text-xs opacity-70">{sub}</span>
    </div>
  );
}
