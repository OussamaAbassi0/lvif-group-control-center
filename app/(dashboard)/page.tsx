import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import {
  TrendingUp,
  Wallet,
  AlertTriangle,
  Target,
  Building2,
  Users,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const supabase = await createClient();

  // ---- KPIs Finance ----
  const { data: accounts } = await supabase
    .from("bank_accounts")
    .select("balance, bank_name, updated_at, company_id, companies(short_name)");

  const totalCash = accounts?.reduce((sum, a) => sum + (a.balance || 0), 0) || 0;

  // ---- KPIs Deals ----
  const { data: overdueDeals } = await supabase
    .from("deals")
    .select("id")
    .lt("next_action_date", new Date().toISOString().split("T")[0])
    .not("status", "in", '("gagne","perdu")');

  const { data: dealsNoAction } = await supabase
    .from("deals")
    .select("id")
    .is("next_action", null)
    .not("status", "in", '("gagne","perdu")');

  const { data: activeDeals } = await supabase
    .from("deals")
    .select("id")
    .not("status", "in", '("gagne","perdu")');

  // ---- KPIs Factures ----
  const { data: unpaidInvoices } = await supabase
    .from("invoices")
    .select("amount")
    .eq("type", "payable")
    .neq("status", "paid");

  const totalUnpaid =
    unpaidInvoices?.reduce((sum, i) => sum + (i.amount || 0), 0) || 0;

  // ---- KPIs Immobilier ----
  const { data: units } = await supabase
    .from("units")
    .select("status");

  const occupiedUnits = units?.filter((u) => u.status === "occupied").length || 0;
  const totalUnits = units?.length || 0;
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  // ---- Loyers en retard ----
  const { data: overdueRents } = await supabase
    .from("rent_payments")
    .select("id")
    .eq("status", "overdue");

  const today = new Date();
  const dateStr = today.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      <Header
        title="Vue d'ensemble"
        subtitle={`Groupe LVIF — ${dateStr}`}
      />

      <div className="p-6 space-y-6">
        {/* Section Finance */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Trésorerie Groupe
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard
              title="Trésorerie totale groupe"
              value={formatCurrency(totalCash)}
              icon={Wallet}
              iconColor="text-brand-600"
              subtitle="Toutes sociétés confondues"
            />
            <KpiCard
              title="Factures fournisseurs à payer"
              value={formatCurrency(totalUnpaid)}
              icon={AlertTriangle}
              iconColor="text-orange-500"
              alert={totalUnpaid > 0}
              subtitle={`${unpaidInvoices?.length || 0} facture(s) en attente`}
            />
            <KpiCard
              title="Deals actifs"
              value={activeDeals?.length || 0}
              icon={Target}
              iconColor="text-emerald-600"
              subtitle="Opportunités en cours"
            />
            <KpiCard
              title="Actions en retard"
              value={overdueDeals?.length || 0}
              icon={AlertTriangle}
              iconColor="text-red-600"
              alert={(overdueDeals?.length || 0) > 0}
              subtitle="À traiter en priorité"
            />
          </div>
        </section>

        {/* Section Commercial */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Activité Commerciale
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard
              title="Deals sans prochaine action"
              value={dealsNoAction?.length || 0}
              icon={Target}
              iconColor="text-orange-500"
              alert={(dealsNoAction?.length || 0) > 0}
              subtitle="À compléter dans eWay CRM"
            />
            <KpiCard
              title="Taux d'occupation immo"
              value={`${occupancyRate}%`}
              icon={Building2}
              iconColor="text-brand-600"
              subtitle={`${occupiedUnits}/${totalUnits} unités occupées`}
            />
            <KpiCard
              title="Loyers en retard"
              value={overdueRents?.length || 0}
              icon={AlertTriangle}
              iconColor="text-red-600"
              alert={(overdueRents?.length || 0) > 0}
              subtitle="Locataires à relancer"
            />
            <KpiCard
              title="Utilisateurs actifs"
              value="—"
              icon={Users}
              iconColor="text-gray-400"
              subtitle="Dashboard phase 2"
            />
          </div>
        </section>

        {/* Trésorerie par société */}
        {accounts && accounts.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Trésorerie par société
            </h2>
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Société</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Banque</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-600">Solde</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-600">Mis à jour</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-gray-50/50">
                      <td className="px-5 py-3 font-medium text-gray-900">
                        {(account.companies as { short_name: string } | null)?.short_name || "—"}
                      </td>
                      <td className="px-5 py-3 text-gray-600">{account.bank_name}</td>
                      <td className={`px-5 py-3 text-right font-semibold ${account.balance >= 0 ? "text-gray-900" : "text-red-600"}`}>
                        {formatCurrency(account.balance)}
                      </td>
                      <td className="px-5 py-3 text-right text-gray-400 text-xs">
                        {new Date(account.updated_at).toLocaleDateString("fr-FR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* État vide — données à venir */}
        {(!accounts || accounts.length === 0) && (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center">
            <TrendingUp className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">
              Les données apparaîtront ici une fois les connexions API configurées.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              eWay CRM · Qonto · Pennylane · BNP
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
