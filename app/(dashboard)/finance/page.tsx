import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Wallet, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const COMPANY_COLORS: Record<string, string> = {
  LVIF: "bg-brand-600",
  ENO:  "bg-violet-600",
  TJM:  "bg-emerald-600",
  SCI:  "bg-amber-600",
  HLD:  "bg-gray-600",
};

export default async function FinancePage() {
  const supabase = await createClient();

  // Trésorerie par compte
  const { data: accounts } = await supabase
    .from("bank_accounts")
    .select("*, companies(name, short_name, color)")
    .order("balance", { ascending: false });

  const totalCash = accounts?.reduce((s, a) => s + (a.balance || 0), 0) || 0;

  // Factures clients (à encaisser)
  const { data: receivable } = await supabase
    .from("invoices")
    .select("amount, status, due_date, counterparty, companies(short_name)")
    .eq("type", "receivable")
    .neq("status", "paid")
    .order("due_date", { ascending: true });

  const totalReceivable = receivable?.reduce((s, i) => s + (i.amount || 0), 0) || 0;

  // Factures fournisseurs (à payer)
  const { data: payable } = await supabase
    .from("invoices")
    .select("amount, status, due_date, counterparty, companies(short_name)")
    .eq("type", "payable")
    .neq("status", "paid")
    .order("due_date", { ascending: true });

  const totalPayable = payable?.reduce((s, i) => s + (i.amount || 0), 0) || 0;

  // Factures en retard
  const today = new Date().toISOString().split("T")[0];
  const overduePayable = payable?.filter(
    (i) => i.due_date && i.due_date < today
  );

  return (
    <div>
      <Header
        title="Centre Financier"
        subtitle="Trésorerie, factures et flux financiers du groupe"
      />

      <div className="p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            title="Trésorerie totale groupe"
            value={formatCurrency(totalCash)}
            icon={Wallet}
            iconColor="text-brand-600"
            subtitle="Tous comptes consolidés"
          />
          <KpiCard
            title="À encaisser (clients)"
            value={formatCurrency(totalReceivable)}
            icon={TrendingUp}
            iconColor="text-emerald-600"
            subtitle={`${receivable?.length || 0} facture(s) en cours`}
          />
          <KpiCard
            title="À payer (fournisseurs)"
            value={formatCurrency(totalPayable)}
            icon={TrendingDown}
            iconColor="text-orange-500"
            alert={totalPayable > 0}
            subtitle={`${payable?.length || 0} facture(s) à régler`}
          />
          <KpiCard
            title="Paiements en retard"
            value={formatCurrency(
              overduePayable?.reduce((s, i) => s + (i.amount || 0), 0) || 0
            )}
            icon={AlertTriangle}
            iconColor="text-red-600"
            alert={(overduePayable?.length || 0) > 0}
            subtitle={`${overduePayable?.length || 0} facture(s) échues`}
          />
        </div>

        {/* Trésorerie par compte */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Détail par compte bancaire
          </h2>
          {accounts && accounts.length > 0 ? (
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
                  {accounts.map((account) => {
                    const shortName =
                      (account.companies as { short_name: string } | null)
                        ?.short_name || "";
                    return (
                      <tr
                        key={account.id}
                        className="border-b last:border-0 hover:bg-gray-50/50"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full",
                                COMPANY_COLORS[shortName] || "bg-gray-400"
                              )}
                            />
                            <span className="font-medium text-gray-900">
                              {(account.companies as { name: string } | null)?.name || "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-gray-600">{account.bank_name}</td>
                        <td className="px-5 py-3 text-gray-600">{account.account_name}</td>
                        <td
                          className={cn(
                            "px-5 py-3 text-right font-bold",
                            account.balance >= 0
                              ? "text-gray-900"
                              : "text-red-600"
                          )}
                        >
                          {formatCurrency(account.balance)}
                        </td>
                        <td className="px-5 py-3 text-right text-xs text-gray-400">
                          {formatDate(account.updated_at)}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Total */}
                  <tr className="bg-gray-50 border-t-2">
                    <td colSpan={3} className="px-5 py-3 font-semibold text-gray-900">
                      Total consolidé
                    </td>
                    <td
                      className={cn(
                        "px-5 py-3 text-right font-bold text-base",
                        totalCash >= 0 ? "text-gray-900" : "text-red-600"
                      )}
                    >
                      {formatCurrency(totalCash)}
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState text="Les données bancaires apparaîtront ici après connexion Qonto / Pennylane / BNP." />
          )}
        </section>

        {/* Factures fournisseurs à payer */}
        {(payable?.length || 0) > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Factures fournisseurs à régler
            </h2>
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Fournisseur</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Société</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Statut</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-600">Montant</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-600">Échéance</th>
                  </tr>
                </thead>
                <tbody>
                  {payable!.map((inv, i) => {
                    const isLate = inv.due_date && inv.due_date < today;
                    return (
                      <tr
                        key={i}
                        className={cn(
                          "border-b last:border-0 hover:bg-gray-50/50",
                          isLate && "bg-red-50/20"
                        )}
                      >
                        <td className="px-5 py-3 font-medium text-gray-900">
                          {inv.counterparty}
                        </td>
                        <td className="px-5 py-3 text-gray-500 text-xs">
                          {(inv.companies as { short_name: string } | null)?.short_name || "—"}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={cn(
                              "inline-flex px-2 py-0.5 rounded-full text-xs font-medium",
                              isLate
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            )}
                          >
                            {isLate ? "En retard" : "En attente"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-gray-900">
                          {formatCurrency(inv.amount)}
                        </td>
                        <td
                          className={cn(
                            "px-5 py-3 text-right text-xs font-medium",
                            isLate ? "text-red-600" : "text-gray-500"
                          )}
                        >
                          {inv.due_date ? formatDate(inv.due_date) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center">
      <Wallet className="w-8 h-8 text-gray-300 mx-auto mb-3" />
      <p className="text-sm font-medium text-gray-500">{text}</p>
    </div>
  );
}
