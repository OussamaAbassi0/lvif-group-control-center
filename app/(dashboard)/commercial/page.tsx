import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { AlertTriangle, Target, Clock, TrendingUp } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  prospect: "Prospect",
  qualification: "Qualification",
  proposition: "Proposition",
  negociation: "Négociation",
  gagne: "Gagné",
  perdu: "Perdu",
};

const STATUS_COLORS: Record<string, string> = {
  prospect: "bg-gray-100 text-gray-700",
  qualification: "bg-blue-100 text-blue-700",
  proposition: "bg-yellow-100 text-yellow-700",
  negociation: "bg-orange-100 text-orange-700",
  gagne: "bg-emerald-100 text-emerald-700",
  perdu: "bg-red-100 text-red-700",
};

export default async function CommercialPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  // Deals actions en retard
  const { data: overdueDeals } = await supabase
    .from("deals")
    .select("*, profiles(full_name)")
    .lt("next_action_date", today)
    .not("status", "in", '("gagne","perdu")')
    .order("next_action_date", { ascending: true });

  // Deals sans prochaine action
  const { data: noActionDeals } = await supabase
    .from("deals")
    .select("*, profiles(full_name)")
    .is("next_action", null)
    .not("status", "in", '("gagne","perdu")')
    .order("amount", { ascending: false });

  // Deals à traiter aujourd'hui
  const { data: todayDeals } = await supabase
    .from("deals")
    .select("*, profiles(full_name)")
    .eq("next_action_date", today)
    .not("status", "in", '("gagne","perdu")')
    .order("amount", { ascending: false });

  // Tous les deals actifs
  const { data: activeDealsRaw } = await supabase
    .from("deals")
    .select("amount")
    .not("status", "in", '("gagne","perdu")');

  const activeDeals = activeDealsRaw as Array<{ amount: number | null }> | null;
  const totalPipeline = activeDeals?.reduce((s, d) => s + (d.amount || 0), 0) || 0;

  return (
    <div>
      <Header
        title="Actions Commerciales"
        subtitle="Ce que les équipes doivent faire aujourd'hui"
      />

      <div className="p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            title="Actions en retard"
            value={overdueDeals?.length || 0}
            icon={AlertTriangle}
            iconColor="text-red-600"
            alert={(overdueDeals?.length || 0) > 0}
            subtitle="À traiter immédiatement"
          />
          <KpiCard
            title="Actions aujourd'hui"
            value={todayDeals?.length || 0}
            icon={Target}
            iconColor="text-orange-500"
            subtitle="Planifiées ce jour"
          />
          <KpiCard
            title="Deals sans action"
            value={noActionDeals?.length || 0}
            icon={Clock}
            iconColor="text-yellow-500"
            alert={(noActionDeals?.length || 0) > 0}
            subtitle="Aucune prochaine étape"
          />
          <KpiCard
            title="Pipeline total"
            value={formatCurrency(totalPipeline)}
            icon={TrendingUp}
            iconColor="text-brand-600"
            subtitle={`${activeDeals?.length || 0} opportunités actives`}
          />
        </div>

        {/* Actions en retard */}
        {(overdueDeals?.length || 0) > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Actions en retard ({overdueDeals!.length})
            </h2>
            <DealTable deals={overdueDeals!} variant="overdue" />
          </section>
        )}

        {/* Actions du jour */}
        {(todayDeals?.length || 0) > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-orange-600 uppercase tracking-wider mb-3">
              À faire aujourd'hui ({todayDeals!.length})
            </h2>
            <DealTable deals={todayDeals!} />
          </section>
        )}

        {/* Deals sans action */}
        {(noActionDeals?.length || 0) > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-yellow-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Sans prochaine action ({noActionDeals!.length})
            </h2>
            <DealTable deals={noActionDeals!} variant="no-action" />
          </section>
        )}

        {/* État vide */}
        {(overdueDeals?.length || 0) === 0 &&
          (todayDeals?.length || 0) === 0 &&
          (noActionDeals?.length || 0) === 0 && (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center">
              <Target className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500">
                Aucune action en attente — tout est à jour 🎉
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Les deals seront synchronisés depuis eWay CRM toutes les 15 minutes.
              </p>
            </div>
          )}
      </div>
    </div>
  );
}

// ---- Composant table deals ----
function DealTable({
  deals,
  variant,
}: {
  deals: Array<{
    id: string;
    title: string;
    client_name: string | null;
    amount: number | null;
    status: string;
    next_action: string | null;
    next_action_date: string | null;
    profiles: { full_name: string | null } | null;
  }>;
  variant?: "overdue" | "no-action";
}) {
  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50/50">
            <th className="text-left px-5 py-3 font-medium text-gray-600">Deal</th>
            <th className="text-left px-5 py-3 font-medium text-gray-600">Statut</th>
            <th className="text-left px-5 py-3 font-medium text-gray-600">Responsable</th>
            <th className="text-left px-5 py-3 font-medium text-gray-600">Prochaine action</th>
            <th className="text-right px-5 py-3 font-medium text-gray-600">Montant</th>
            <th className="text-right px-5 py-3 font-medium text-gray-600">Échéance</th>
          </tr>
        </thead>
        <tbody>
          {deals.map((deal) => {
            const isLate =
              variant === "overdue" ||
              (deal.next_action_date &&
                deal.next_action_date < new Date().toISOString().split("T")[0]);

            return (
              <tr
                key={deal.id}
                className={cn(
                  "border-b last:border-0 hover:bg-gray-50/50",
                  isLate && "bg-red-50/20"
                )}
              >
                <td className="px-5 py-3">
                  <p className="font-medium text-gray-900">{deal.title}</p>
                  {deal.client_name && (
                    <p className="text-xs text-gray-500">{deal.client_name}</p>
                  )}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                      STATUS_COLORS[deal.status] || "bg-gray-100 text-gray-700"
                    )}
                  >
                    {STATUS_LABELS[deal.status] || deal.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-600">
                  {deal.profiles?.full_name || "—"}
                </td>
                <td className="px-5 py-3 text-gray-700 max-w-xs">
                  {deal.next_action ? (
                    <span>{deal.next_action}</span>
                  ) : (
                    <span className="text-yellow-600 font-medium italic">
                      Aucune action définie
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-right font-semibold text-gray-900">
                  {deal.amount ? formatCurrency(deal.amount) : "—"}
                </td>
                <td
                  className={cn(
                    "px-5 py-3 text-right text-xs font-medium",
                    isLate ? "text-red-600" : "text-gray-500"
                  )}
                >
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
