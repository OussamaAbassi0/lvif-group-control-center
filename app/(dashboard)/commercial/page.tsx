import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import {
  AlertTriangle, Target, Clock, TrendingUp,
  CheckCircle2, Flame, Trophy,
} from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  prospect:      "Prospect",
  qualification: "Qualification",
  proposition:   "Proposition",
  negociation:   "Négociation",
  gagne:         "Gagné ✓",
  perdu:         "Perdu",
};

const STATUS_COLORS: Record<string, string> = {
  prospect:      "bg-gray-100 text-gray-700",
  qualification: "bg-blue-100 text-blue-700",
  proposition:   "bg-yellow-100 text-yellow-700",
  negociation:   "bg-orange-100 text-orange-700",
  gagne:         "bg-emerald-100 text-emerald-700",
  perdu:         "bg-red-100 text-red-700",
};

const PRIORITY_CONFIG: Record<number, { label: string; className: string; icon: string }> = {
  0: { label: "Normal",   className: "bg-gray-100 text-gray-500",    icon: "" },
  1: { label: "Haute",    className: "bg-blue-100 text-blue-700",    icon: "↑" },
  2: { label: "Urgente",  className: "bg-orange-100 text-orange-700", icon: "↑↑" },
  3: { label: "Critique", className: "bg-red-100 text-red-700",      icon: "🔥" },
};

const COMPANY_BADGE: Record<string, string> = {
  LVIF: "bg-brand-100 text-brand-700 border border-brand-200",
  ENO:  "bg-violet-100 text-violet-700 border border-violet-200",
  TJM:  "bg-emerald-100 text-emerald-700 border border-emerald-200",
};

export default async function CommercialPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  // Tous les deals actifs avec détails
  const { data: allDeals } = await supabase
    .from("deals")
    .select("*, profiles(full_name), companies(short_name, name)")
    .order("priority", { ascending: false })
    .order("next_action_date", { ascending: true });

  const activeDeals = allDeals?.filter((d) => !["gagne", "perdu"].includes(d.status)) ?? [];
  const overdueDeals = activeDeals.filter((d) => d.next_action_date && d.next_action_date < today);
  const todayDeals = activeDeals.filter((d) => d.next_action_date === today);
  const noActionDeals = activeDeals.filter((d) => !d.next_action);
  const ganneDeals = allDeals?.filter((d) => d.status === "gagne") ?? [];
  const totalPipeline = activeDeals.reduce((s, d) => s + (d.amount ?? 0), 0);
  const totalGagne = ganneDeals.reduce((s, d) => s + (d.amount ?? 0), 0);

  // Pipeline par étape (excluant gagné/perdu pour l'entonnoir)
  const stageOrder = ["prospect", "qualification", "proposition", "negociation"];
  const pipelineStages = stageOrder.map((s) => {
    const stageDeals = activeDeals.filter((d) => d.status === s);
    return {
      status: s,
      label: STATUS_LABELS[s],
      count: stageDeals.length,
      amount: stageDeals.reduce((sum, d) => sum + (d.amount ?? 0), 0),
    };
  });

  const upcomingDeals = activeDeals.filter(
    (d) => d.next_action_date && d.next_action_date > today && d.next_action_date <= new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]
  );

  return (
    <div>
      <Header
        title="Actions Commerciales"
        subtitle="Pipeline LVIF · Eno Events · TJM Advertising"
      />

      <div className="p-6 space-y-6">

        {/* ---- KPIs ---- */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            title="Actions en retard"
            value={overdueDeals.length}
            icon={AlertTriangle}
            iconColor="text-red-600"
            alert={overdueDeals.length > 0}
            subtitle="À traiter immédiatement"
          />
          <KpiCard
            title="Actions aujourd'hui"
            value={todayDeals.length}
            icon={Target}
            iconColor="text-orange-500"
            subtitle="Planifiées ce jour"
          />
          <KpiCard
            title="Pipeline total"
            value={formatCurrency(totalPipeline)}
            icon={TrendingUp}
            iconColor="text-brand-600"
            subtitle={`${activeDeals.length} opportunités actives`}
          />
          <KpiCard
            title="Chiffre affaires gagné"
            value={formatCurrency(totalGagne)}
            icon={Trophy}
            iconColor="text-emerald-600"
            subtitle={`${ganneDeals.length} deal(s) signés`}
          />
        </div>

        {/* ---- 2 colonnes : Entonnoir + Alertes ---- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Entonnoir pipeline */}
          <section className="bg-white rounded-xl border p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Entonnoir pipeline</h2>
            <div className="space-y-2.5">
              {pipelineStages.map((s, i) => {
                const maxCount = Math.max(...pipelineStages.map((x) => x.count), 1);
                const barPct = (s.count / maxCount) * 100;
                const stageColors = [
                  "bg-gray-300",
                  "bg-blue-300",
                  "bg-yellow-400",
                  "bg-orange-400",
                ];
                return (
                  <div key={s.status} className="flex items-center gap-3 text-xs">
                    <span className="w-24 text-gray-600 text-right font-medium shrink-0">{s.label}</span>
                    <div className="flex-1 h-8 bg-gray-50 rounded-lg overflow-hidden relative border border-gray-100">
                      <div
                        className={cn("h-full rounded-lg transition-all flex items-center px-3", stageColors[i])}
                        style={{ width: `${Math.max(barPct, s.count > 0 ? 10 : 0)}%` }}
                      >
                        {s.count > 0 && (
                          <span className="text-[11px] font-bold text-gray-700">
                            {s.count} deal{s.count > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="w-24 text-right font-semibold text-gray-800 shrink-0">
                      {s.amount > 0 ? formatCurrency(s.amount) : "—"}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Deals gagnés */}
            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-xs font-medium text-emerald-700">Deals signés</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-700">{formatCurrency(totalGagne)}</span>
                <span className="text-xs text-gray-400 ml-2">({ganneDeals.length} deals)</span>
              </div>
            </div>
          </section>

          {/* Alertes rapides */}
          <section className="bg-white rounded-xl border p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              Attention requise
            </h2>
            {overdueDeals.length === 0 && noActionDeals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
                <p className="text-sm font-medium text-gray-500">Tout est à jour</p>
                <p className="text-xs text-gray-400 mt-0.5">Aucune action en retard 🎉</p>
              </div>
            ) : (
              <div className="space-y-2">
                {overdueDeals.slice(0, 5).map((d) => {
                  const co = d.companies as { short_name: string } | null;
                  return (
                    <div key={d.id} className="flex items-start justify-between bg-red-50 rounded-lg px-3 py-2.5 border border-red-200">
                      <div>
                        <p className="text-xs font-semibold text-red-800">{d.title}</p>
                        <p className="text-[11px] text-red-600">{d.client_name} · {d.next_action}</p>
                      </div>
                      <div className="flex items-center gap-1.5 ml-2 shrink-0">
                        {co && <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded", COMPANY_BADGE[co.short_name])}>{co.short_name}</span>}
                        <span className="text-[10px] text-red-600 font-medium">{formatDate(d.next_action_date!)}</span>
                      </div>
                    </div>
                  );
                })}
                {noActionDeals.length > 0 && (
                  <div className="flex items-center justify-between bg-yellow-50 rounded-lg px-3 py-2.5 border border-yellow-200">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-yellow-600" />
                      <p className="text-xs font-medium text-yellow-800">
                        {noActionDeals.length} deal{noActionDeals.length > 1 ? "s" : ""} sans prochaine action
                      </p>
                    </div>
                    <span className="text-[10px] text-yellow-700 font-semibold">→ à planifier</span>
                  </div>
                )}
              </div>
            )}

            {/* Cette semaine */}
            {upcomingDeals.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs font-medium text-gray-500 mb-2">Cette semaine ({upcomingDeals.length})</p>
                <div className="space-y-1.5">
                  {upcomingDeals.slice(0, 3).map((d) => (
                    <div key={d.id} className="flex items-center justify-between text-xs">
                      <span className="text-gray-700 truncate">{d.title}</span>
                      <span className="text-gray-400 shrink-0 ml-2">{formatDate(d.next_action_date!)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ---- Actions en retard (table complète) ---- */}
        {overdueDeals.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Actions en retard ({overdueDeals.length})
            </h2>
            <DealTable deals={overdueDeals} variant="overdue" />
          </section>
        )}

        {/* ---- Actions du jour ---- */}
        {todayDeals.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-orange-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              À faire aujourd'hui ({todayDeals.length})
            </h2>
            <DealTable deals={todayDeals} />
          </section>
        )}

        {/* ---- Tous les deals actifs ---- */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Tous les deals actifs ({activeDeals.length})
          </h2>
          {activeDeals.length > 0 ? (
            <DealTable deals={activeDeals} showAll />
          ) : (
            <EmptyState />
          )}
        </section>

        {/* ---- Deals sans action ---- */}
        {noActionDeals.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-yellow-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Sans prochaine action ({noActionDeals.length})
            </h2>
            <DealTable deals={noActionDeals} variant="no-action" />
          </section>
        )}
      </div>
    </div>
  );
}

type Deal = {
  id: string;
  title: string;
  client_name: string | null;
  amount: number | null;
  status: string;
  priority: number | null;
  next_action: string | null;
  next_action_date: string | null;
  profiles: { full_name: string | null } | null;
  companies: { short_name: string; name: string } | null;
};

function DealTable({
  deals,
  variant,
  showAll = false,
}: {
  deals: Deal[];
  variant?: "overdue" | "no-action";
  showAll?: boolean;
}) {
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50/50">
            <th className="text-left px-5 py-3 font-medium text-gray-600">Deal</th>
            <th className="text-left px-5 py-3 font-medium text-gray-600 hidden md:table-cell">Société</th>
            <th className="text-left px-5 py-3 font-medium text-gray-600">Statut</th>
            <th className="text-left px-5 py-3 font-medium text-gray-600 hidden lg:table-cell">Prochaine action</th>
            <th className="text-right px-5 py-3 font-medium text-gray-600">Montant</th>
            <th className="text-right px-5 py-3 font-medium text-gray-600 hidden xl:table-cell">Responsable</th>
            <th className="text-right px-5 py-3 font-medium text-gray-600">Échéance</th>
          </tr>
        </thead>
        <tbody>
          {deals.map((deal) => {
            const isLate = variant === "overdue" || (deal.next_action_date && deal.next_action_date < today);
            const pConf = PRIORITY_CONFIG[deal.priority ?? 0];
            const co = deal.companies;

            return (
              <tr
                key={deal.id}
                className={cn(
                  "border-b last:border-0 hover:bg-gray-50/40 transition-colors",
                  isLate && "bg-red-50/20",
                  deal.status === "gagne" && "bg-emerald-50/20"
                )}
              >
                <td className="px-5 py-3">
                  <div className="flex items-start gap-2">
                    {(deal.priority ?? 0) > 0 && (
                      <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5", pConf.className)}>
                        {pConf.icon}
                      </span>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{deal.title}</p>
                      {deal.client_name && (
                        <p className="text-xs text-gray-500">{deal.client_name}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 hidden md:table-cell">
                  {co && (
                    <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded", COMPANY_BADGE[co.short_name] ?? "bg-gray-100 text-gray-600")}>
                      {co.short_name}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLORS[deal.status])}>
                    {STATUS_LABELS[deal.status] || deal.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-700 max-w-xs hidden lg:table-cell">
                  {deal.next_action ? (
                    <span className="text-xs">{deal.next_action}</span>
                  ) : (
                    <span className="text-yellow-600 font-medium italic text-xs">Aucune action définie</span>
                  )}
                </td>
                <td className="px-5 py-3 text-right font-semibold text-gray-900">
                  {deal.amount ? formatCurrency(deal.amount) : "—"}
                </td>
                <td className="px-5 py-3 text-right text-xs text-gray-500 hidden xl:table-cell">
                  {deal.profiles?.full_name || "—"}
                </td>
                <td className={cn("px-5 py-3 text-right text-xs font-medium", isLate ? "text-red-600" : "text-gray-500")}>
                  {deal.next_action_date ? formatDate(deal.next_action_date) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center">
      <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
      <p className="text-sm font-medium text-gray-500">Aucune action en attente — tout est à jour 🎉</p>
      <p className="text-xs text-gray-400 mt-1">Les deals seront synchronisés depuis eWay CRM toutes les 15 minutes.</p>
    </div>
  );
}
