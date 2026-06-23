import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { BuildingPlan } from "@/components/immobilier/building-plan";
import {
  Building2,
  AlertTriangle,
  CheckCircle,
  FileWarning,
  Euro,
  TrendingUp,
} from "lucide-react";
import { formatCurrency, formatDate, getDaysUntil, formatPercent } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default async function ImmobilierPage() {
  const supabase = await createClient();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const today = new Date().toISOString().split("T")[0];

  // Sites avec unités et locataires imbriqués
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

  // Tous les locataires avec contexte complet
  const { data: tenants } = await supabase
    .from("tenants")
    .select(`
      *,
      units(name, surface, site_id, sites(name, city)),
      tenant_documents(type, expiry_date, status),
      rent_payments(month, expected_amount, received_amount, status)
    `)
    .order("company_name");

  // ---- KPIs globaux ----
  const allUnits = sites?.flatMap((s) => s.units ?? []) ?? [];
  const occupiedUnits = allUnits.filter((u) => u.status === "occupied");
  const vacantUnits = allUnits.filter((u) => u.status === "vacant");
  const occupancyRate = allUnits.length ? (occupiedUnits.length / allUnits.length) * 100 : 0;
  const totalRentMonthly = tenants?.reduce((s, t) => s + (t.rent_amount ?? 0), 0) ?? 0;
  const totalRentAnnual = totalRentMonthly * 12;

  // ---- Alertes ----
  const expiringSoonLeases = tenants?.filter((t) => {
    if (!t.lease_end) return false;
    const days = getDaysUntil(t.lease_end);
    return days >= 0 && days <= 90;
  }) ?? [];

  const alertDocs = tenants?.filter((t) =>
    t.tenant_documents?.some(
      (d) =>
        d.type === "insurance" &&
        (d.status === "expired" || d.status === "missing" || d.status === "expiring_soon")
    )
  ) ?? [];

  const overdueRents = tenants?.filter((t) =>
    t.rent_payments?.some((p) => p.month === currentMonth && p.status === "overdue")
  ) ?? [];

  const pendingRents = tenants?.filter((t) =>
    t.rent_payments?.some((p) => p.month === currentMonth && p.status === "pending")
  ) ?? [];

  // Loyers encaissés ce mois
  const collectedThisMonth = tenants?.reduce((s, t) => {
    const p = t.rent_payments?.find((rp) => rp.month === currentMonth && rp.status === "paid");
    return s + (p?.received_amount ?? 0);
  }, 0) ?? 0;

  // Taux de recouvrement
  const recoveryRate = totalRentMonthly > 0 ? (collectedThisMonth / totalRentMonthly) * 100 : 0;

  return (
    <div>
      <Header
        title="Gestion Immobilière"
        subtitle="Saint-Rémy-de-Provence & Auxerre — SCI Maya"
      />

      <div className="p-6 space-y-6">

        {/* ---- KPIs row 1 ---- */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            title="Taux d'occupation"
            value={formatPercent(occupancyRate)}
            icon={Building2}
            iconColor="text-brand-600"
            subtitle={`${occupiedUnits.length} occupés · ${vacantUnits.length} vacants`}
          />
          <KpiCard
            title="Loyers mensuels"
            value={formatCurrency(totalRentMonthly)}
            icon={Euro}
            iconColor="text-emerald-600"
            subtitle={`${formatCurrency(totalRentAnnual)}/an`}
          />
          <KpiCard
            title="Recouvrement mois en cours"
            value={formatPercent(recoveryRate)}
            icon={TrendingUp}
            iconColor={recoveryRate >= 90 ? "text-emerald-600" : "text-orange-500"}
            alert={recoveryRate < 90}
            subtitle={`${formatCurrency(collectedThisMonth)} encaissé`}
          />
          <KpiCard
            title="Alertes actives"
            value={(overdueRents.length + alertDocs.length + expiringSoonLeases.length)}
            icon={AlertTriangle}
            iconColor="text-red-600"
            alert={(overdueRents.length + alertDocs.length + expiringSoonLeases.length) > 0}
            subtitle="Loyers, docs, baux"
          />
        </div>

        {/* ---- Alertes prioritaires ---- */}
        {(overdueRents.length > 0 || alertDocs.length > 0 || expiringSoonLeases.length > 0) && (
          <section>
            <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Alertes prioritaires
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Loyers impayés */}
              {overdueRents.length > 0 && (
                <AlertCard
                  title="Loyers impayés"
                  count={overdueRents.length}
                  color="red"
                  items={overdueRents.map((t) => ({
                    label: t.company_name,
                    sub: `${formatCurrency(t.rent_amount)} · ${(t.units as { sites: { name: string } } | null)?.sites?.name ?? ""}`,
                    badge: "Impayé",
                  }))}
                />
              )}
              {/* Assurances */}
              {alertDocs.length > 0 && (
                <AlertCard
                  title="Assurances à régulariser"
                  count={alertDocs.length}
                  color="orange"
                  items={alertDocs.map((t) => {
                    const doc = t.tenant_documents?.find((d) => d.type === "insurance");
                    return {
                      label: t.company_name,
                      sub: (t.units as { sites: { name: string } } | null)?.sites?.name ?? "",
                      badge: doc?.status === "expired" ? "Expirée" : doc?.status === "missing" ? "Manquante" : "Expire bientôt",
                    };
                  })}
                />
              )}
              {/* Baux expirant */}
              {expiringSoonLeases.length > 0 && (
                <AlertCard
                  title="Baux à renouveler"
                  count={expiringSoonLeases.length}
                  color="yellow"
                  items={expiringSoonLeases.map((t) => ({
                    label: t.company_name,
                    sub: `Expire ${formatDate(t.lease_end!)} · dans ${getDaysUntil(t.lease_end!)}j`,
                    badge: `${getDaysUntil(t.lease_end!)}j`,
                  }))}
                />
              )}
            </div>
          </section>
        )}

        {/* ---- Plans de masse interactifs par site ---- */}
        {sites?.map((site) => {
          const siteUnits = (site.units ?? []) as Array<{
            id: string;
            name: string;
            surface: number;
            status: string;
            monthly_rent: number | null;
            position_x: number | null;
            position_y: number | null;
            width: number | null;
            height: number | null;
            tenants: Array<{
              id: string;
              company_name: string;
              rent_amount: number;
              lease_end: string | null;
              tenant_documents: Array<{ type: string; status: string; expiry_date: string | null }>;
              rent_payments: Array<{ month: string; status: string }>;
            }> | null;
          }>;

          const siteTenantCount = siteUnits.filter((u) => u.status === "occupied").length;
          const siteVacantCount = siteUnits.filter((u) => u.status === "vacant").length;
          const siteMonthlyRent = siteUnits.reduce((s, u) => {
            return s + ((u.tenants?.[0]?.rent_amount) ?? 0);
          }, 0);

          // Transformer les unités pour le composant BuildingPlan
          const planUnits = siteUnits.map((u) => {
            const tenant = u.tenants?.[0] ?? null;
            const insurance = tenant?.tenant_documents?.find((d) => d.type === "insurance");
            const currentPayment = tenant?.rent_payments?.find((p) => p.month === currentMonth);
            return {
              id: u.id,
              name: u.name,
              surface: u.surface,
              status: u.status,
              monthly_rent: u.monthly_rent,
              position_x: u.position_x,
              position_y: u.position_y,
              width: u.width,
              height: u.height,
              tenant: tenant
                ? {
                    company_name: tenant.company_name,
                    rent_amount: tenant.rent_amount,
                    lease_end: tenant.lease_end,
                    payment_status: currentPayment?.status ?? "pending",
                    insurance_status: insurance?.status ?? "missing",
                  }
                : null,
            };
          });

          return (
            <section key={site.id}>
              {/* Site header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-600" />
                    {site.name}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">{site.address}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border">
                  <span><span className="font-semibold text-gray-900">{siteTenantCount}</span> occupés</span>
                  <span><span className="font-semibold text-gray-400">{siteVacantCount}</span> vacants</span>
                  <span><span className="font-semibold text-emerald-700">{formatCurrency(siteMonthlyRent)}</span>/mois</span>
                  <span><span className="font-semibold text-gray-900">{site.total_surface} m²</span></span>
                </div>
              </div>

              {/* Plan SVG interactif */}
              <BuildingPlan siteName={site.name} units={planUnits} />

              {/* Table locataires du site */}
              {siteTenantCount > 0 && (
                <div className="mt-4 bg-white rounded-xl border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50/50">
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Locataire</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Unité</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-600">Loyer/mois</th>
                        <th className="text-center px-4 py-3 font-medium text-gray-600">Paiement {currentMonth}</th>
                        <th className="text-center px-4 py-3 font-medium text-gray-600">Assurance</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-600">Fin de bail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {planUnits
                        .filter((u) => u.status === "occupied" && u.tenant)
                        .map((u) => {
                          const t = u.tenant!;
                          const daysToEnd = t.lease_end ? getDaysUntil(t.lease_end) : null;
                          const isLeaseAlert = daysToEnd !== null && daysToEnd <= 90;
                          const isPaymentAlert = t.payment_status === "overdue";
                          const isInsuranceAlert = t.insurance_status === "expired" || t.insurance_status === "missing";

                          return (
                            <tr
                              key={u.id}
                              className={cn(
                                "border-b last:border-0 hover:bg-gray-50/30 transition-colors",
                                (isPaymentAlert || isInsuranceAlert) && "bg-red-50/30"
                              )}
                            >
                              <td className="px-4 py-3">
                                <p className="font-medium text-gray-900">{t.company_name}</p>
                              </td>
                              <td className="px-4 py-3 text-gray-600 text-xs">{u.name}</td>
                              <td className="px-4 py-3 text-right font-semibold text-gray-900">
                                {formatCurrency(t.rent_amount)}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <StatusBadge status={t.payment_status ?? "pending"} />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <StatusBadge status={t.insurance_status ?? "missing"} type="doc" />
                              </td>
                              <td className="px-4 py-3 text-right">
                                {t.lease_end ? (
                                  <div>
                                    <p className={cn("text-xs font-medium", isLeaseAlert ? "text-orange-600" : "text-gray-600")}>
                                      {formatDate(t.lease_end)}
                                    </p>
                                    {isLeaseAlert && (
                                      <p className="text-[11px] text-orange-500 font-medium">
                                        dans {daysToEnd}j ⚠
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400">Indéterminé</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Lots vacants */}
              {siteVacantCount > 0 && (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-500 font-medium">Lots vacants :</span>
                  {siteUnits
                    .filter((u) => u.status === "vacant")
                    .map((u) => (
                      <span
                        key={u.id}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200"
                      >
                        {u.name} · {u.surface} m² · {u.monthly_rent ? formatCurrency(u.monthly_rent) : "—"}/mois
                      </span>
                    ))}
                </div>
              )}
            </section>
          );
        })}

        {/* État vide */}
        {(!sites || sites.length === 0) && (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center">
            <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">
              Aucun site immobilier configuré.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Composants utilitaires ----

function AlertCard({
  title,
  count,
  color,
  items,
}: {
  title: string;
  count: number;
  color: "red" | "orange" | "yellow";
  items: { label: string; sub: string; badge: string }[];
}) {
  const colorClasses = {
    red:    { header: "bg-red-50 border-red-200 text-red-700", badge: "bg-red-100 text-red-700", border: "border-red-200" },
    orange: { header: "bg-orange-50 border-orange-200 text-orange-700", badge: "bg-orange-100 text-orange-700", border: "border-orange-200" },
    yellow: { header: "bg-yellow-50 border-yellow-200 text-yellow-700", badge: "bg-yellow-100 text-yellow-700", border: "border-yellow-200" },
  };
  const cc = colorClasses[color];

  return (
    <div className={cn("rounded-xl border overflow-hidden bg-white", cc.border)}>
      <div className={cn("px-4 py-2.5 flex items-center justify-between border-b", cc.header, cc.border)}>
        <span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", cc.badge)}>{count}</span>
      </div>
      <div>
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b last:border-0">
            <div>
              <p className="text-xs font-medium text-gray-900">{item.label}</p>
              <p className="text-[11px] text-gray-500">{item.sub}</p>
            </div>
            <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded", cc.badge)}>
              {item.badge}
            </span>
          </div>
        ))}
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
    paid:           { label: "Payé ✓", className: "bg-emerald-100 text-emerald-700" },
    pending:        { label: "En attente", className: "bg-yellow-100 text-yellow-700" },
    overdue:        { label: "Impayé !", className: "bg-red-100 text-red-700" },
    valid:          { label: "Valide ✓", className: "bg-emerald-100 text-emerald-700" },
    expiring_soon:  { label: "Expire bientôt", className: "bg-orange-100 text-orange-700" },
    expired:        { label: "Expirée ✗", className: "bg-red-100 text-red-700" },
    missing:        { label: "Manquante", className: "bg-gray-100 text-gray-600" },
  };
  const cfg = config[status] || { label: status, className: "bg-gray-100 text-gray-600" };
  return (
    <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", cfg.className)}>
      {cfg.label}
    </span>
  );
}
