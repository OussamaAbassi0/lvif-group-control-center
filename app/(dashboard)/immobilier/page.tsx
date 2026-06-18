import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import {
  Building2,
  AlertTriangle,
  CheckCircle,
  FileWarning,
} from "lucide-react";
import { formatCurrency, formatDate, getDaysUntil, formatPercent } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default async function ImmobilierPage() {
  const supabase = await createClient();

  type SiteRow = {
    id: string; name: string; city: string; total_surface: number; address: string | null; created_at: string;
    units: Array<{ id: string; name: string; surface: number; status: string; tenants: Array<{ id: string; company_name: string; rent_amount: number; lease_end: string | null }> }>;
  };
  type TenantRow = {
    id: string; company_name: string; contact_name: string | null; contact_email: string | null;
    contact_phone: string | null; rent_amount: number; deposit_amount: number | null;
    lease_start: string; lease_end: string | null; created_at: string; updated_at: string; unit_id: string;
    units: { name: string; surface: number; sites: { name: string } | null } | null;
    tenant_documents: Array<{ type: string; expiry_date: string | null; status: string }>;
    rent_payments: Array<{ month: string; expected_amount: number; received_amount: number | null; status: string }>;
  };

  // Sites avec leurs unités
  const { data: sitesRaw } = await supabase
    .from("sites")
    .select("*, units(id, name, surface, status, tenants(id, company_name, rent_amount, lease_end))")
    .order("name");

  const sites = sitesRaw as SiteRow[] | null;

  // Tous les locataires avec documents et paiements
  const { data: tenantsRaw } = await supabase
    .from("tenants")
    .select(`
      *,
      units(name, surface, sites(name)),
      tenant_documents(type, expiry_date, status),
      rent_payments(month, expected_amount, received_amount, status)
    `)
    .order("company_name");

  const tenants = tenantsRaw as TenantRow[] | null;

  // KPIs globaux
  const allUnits = sites?.flatMap((s) => s.units) || [];
  const occupiedUnits = allUnits.filter((u) => u.status === "occupied");
  const vacantUnits = allUnits.filter((u) => u.status === "vacant");
  const occupancyRate = allUnits.length
    ? (occupiedUnits.length / allUnits.length) * 100
    : 0;

  const totalRent = tenants?.reduce((s, t) => s + (t.rent_amount || 0), 0) || 0;

  // Alertes
  const expiringSoonLeases = tenants?.filter((t) => {
    if (!t.lease_end) return false;
    const days = getDaysUntil(t.lease_end);
    return days >= 0 && days <= 90;
  });

  const expiredInsurance = tenants?.filter((t) =>
    t.tenant_documents?.some(
      (d) => d.type === "insurance" && (d.status === "expired" || d.status === "missing")
    )
  );

  const currentMonth = new Date().toISOString().slice(0, 7);
  const overdueRents = tenants?.filter((t) =>
    t.rent_payments?.some(
      (p) => p.month === currentMonth && p.status === "overdue"
    )
  );

  return (
    <div>
      <Header
        title="Gestion Immobilière"
        subtitle="Saint-Rémy-de-Provence & Auxerre"
      />

      <div className="p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            title="Taux d'occupation"
            value={formatPercent(occupancyRate)}
            icon={Building2}
            iconColor="text-brand-600"
            subtitle={`${occupiedUnits.length}/${allUnits.length} unités`}
          />
          <KpiCard
            title="Loyers mensuels"
            value={formatCurrency(totalRent)}
            icon={CheckCircle}
            iconColor="text-emerald-600"
            subtitle="Total attendu / mois"
          />
          <KpiCard
            title="Baux expirant bientôt"
            value={expiringSoonLeases?.length || 0}
            icon={AlertTriangle}
            iconColor="text-orange-500"
            alert={(expiringSoonLeases?.length || 0) > 0}
            subtitle="Dans les 90 prochains jours"
          />
          <KpiCard
            title="Alertes assurances"
            value={expiredInsurance?.length || 0}
            icon={FileWarning}
            iconColor="text-red-600"
            alert={(expiredInsurance?.length || 0) > 0}
            subtitle="Expirées ou manquantes"
          />
        </div>

        {/* Alertes prioritaires */}
        {(overdueRents?.length || 0) > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Loyers impayés ce mois ({overdueRents!.length})
            </h2>
            <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
              {overdueRents!.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between px-5 py-3.5 border-b last:border-0 hover:bg-red-50/20"
                >
                  <div>
                    <p className="font-medium text-gray-900">{t.company_name}</p>
                    <p className="text-xs text-gray-500">
                      {(t.units as { name: string; sites: { name: string } } | null)?.sites.name} —{" "}
                      {(t.units as { name: string } | null)?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">
                      {formatCurrency(t.rent_amount)}
                    </p>
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                      Impayé
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Liste locataires par site */}
        {sites?.map((site) => {
          const siteUnits = site.units || [];
          const siteTenants = tenants?.filter(
            (t) =>
              (t.units as { sites: { name: string } } | null)?.sites.name === site.name
          ) || [];

          return (
            <section key={site.id}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  {site.name} — {site.city}
                </h2>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {siteUnits.filter((u) => u.status === "occupied").length} occupées
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-300" />
                    {siteUnits.filter((u) => u.status === "vacant").length} vacantes
                  </span>
                </div>
              </div>

              {siteTenants.length > 0 ? (
                <div className="bg-white rounded-xl border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50/50">
                        <th className="text-left px-5 py-3 font-medium text-gray-600">Locataire</th>
                        <th className="text-left px-5 py-3 font-medium text-gray-600">Unité</th>
                        <th className="text-right px-5 py-3 font-medium text-gray-600">Loyer/mois</th>
                        <th className="text-center px-5 py-3 font-medium text-gray-600">Paiement</th>
                        <th className="text-center px-5 py-3 font-medium text-gray-600">Assurance</th>
                        <th className="text-right px-5 py-3 font-medium text-gray-600">Fin de bail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {siteTenants.map((tenant) => {
                        const currentPayment = tenant.rent_payments?.find(
                          (p) => p.month === currentMonth
                        );
                        const insurance = tenant.tenant_documents?.find(
                          (d) => d.type === "insurance"
                        );
                        const daysToLeaseEnd = tenant.lease_end
                          ? getDaysUntil(tenant.lease_end)
                          : null;

                        return (
                          <tr
                            key={tenant.id}
                            className="border-b last:border-0 hover:bg-gray-50/50"
                          >
                            <td className="px-5 py-3 font-medium text-gray-900">
                              {tenant.company_name}
                            </td>
                            <td className="px-5 py-3 text-gray-600">
                              {(tenant.units as { name: string } | null)?.name}
                            </td>
                            <td className="px-5 py-3 text-right font-semibold text-gray-900">
                              {formatCurrency(tenant.rent_amount)}
                            </td>
                            <td className="px-5 py-3 text-center">
                              <StatusBadge
                                status={currentPayment?.status || "pending"}
                              />
                            </td>
                            <td className="px-5 py-3 text-center">
                              <StatusBadge
                                status={insurance?.status || "missing"}
                                type="doc"
                              />
                            </td>
                            <td className="px-5 py-3 text-right">
                              {tenant.lease_end ? (
                                <div>
                                  <p
                                    className={cn(
                                      "text-xs font-medium",
                                      daysToLeaseEnd !== null && daysToLeaseEnd <= 90
                                        ? "text-orange-600"
                                        : "text-gray-600"
                                    )}
                                  >
                                    {formatDate(tenant.lease_end)}
                                  </p>
                                  {daysToLeaseEnd !== null && daysToLeaseEnd <= 90 && (
                                    <p className="text-[11px] text-orange-500">
                                      dans {daysToLeaseEnd}j
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-dashed border-gray-200 p-6 text-center">
                  <p className="text-sm text-gray-400">
                    Aucun locataire enregistré pour ce site.
                  </p>
                </div>
              )}
            </section>
          );
        })}

        {(!sites || sites.length === 0) && (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center">
            <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">
              Les données immobilières apparaîtront ici après saisie des locataires.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({
  status,
  type = "payment",
}: {
  status: string;
  type?: "payment" | "doc";
}) {
  const config: Record<string, { label: string; className: string }> = {
    paid: { label: "Payé", className: "bg-emerald-100 text-emerald-700" },
    pending: { label: "En attente", className: "bg-yellow-100 text-yellow-700" },
    overdue: { label: "Impayé", className: "bg-red-100 text-red-700" },
    valid: { label: "Valide", className: "bg-emerald-100 text-emerald-700" },
    expiring_soon: { label: "Expire bientôt", className: "bg-orange-100 text-orange-700" },
    expired: { label: "Expirée", className: "bg-red-100 text-red-700" },
    missing: { label: "Manquante", className: "bg-gray-100 text-gray-600" },
  };

  const cfg = config[status] || { label: status, className: "bg-gray-100 text-gray-600" };

  return (
    <span
      className={cn(
        "inline-flex px-2 py-0.5 rounded-full text-xs font-medium",
        cfg.className
      )}
    >
      {cfg.label}
    </span>
  );
}
