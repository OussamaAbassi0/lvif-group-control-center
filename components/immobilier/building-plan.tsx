"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type UnitData = {
  id: string;
  name: string;
  surface: number;
  status: string;
  monthly_rent: number | null;
  position_x: number | null;
  position_y: number | null;
  width: number | null;
  height: number | null;
  tenant?: {
    company_name: string;
    rent_amount: number;
    lease_end: string | null;
    payment_status?: string; // 'paid' | 'pending' | 'overdue'
    insurance_status?: string; // 'valid' | 'expiring_soon' | 'expired' | 'missing'
  } | null;
};

type BuildingPlanProps = {
  siteName: string;
  units: UnitData[];
};

function getUnitColor(unit: UnitData): string {
  if (unit.status === "vacant") return "#e5e7eb"; // gray
  const t = unit.tenant;
  if (!t) return "#e5e7eb";
  if (t.payment_status === "overdue") return "#fca5a5"; // red
  if (t.insurance_status === "expired" || t.insurance_status === "missing") return "#fca5a5"; // red
  if (t.insurance_status === "expiring_soon") return "#fed7aa"; // orange
  // Check lease expiry
  if (t.lease_end) {
    const days = Math.ceil((new Date(t.lease_end).getTime() - Date.now()) / 86400000);
    if (days >= 0 && days <= 90) return "#fed7aa"; // orange
    if (days < 0) return "#fca5a5"; // red - expired
  }
  return "#bbf7d0"; // green - ok
}

function getUnitStroke(unit: UnitData): string {
  if (unit.status === "vacant") return "#9ca3af";
  const t = unit.tenant;
  if (!t) return "#9ca3af";
  if (t.payment_status === "overdue") return "#ef4444";
  if (t.insurance_status === "expired" || t.insurance_status === "missing") return "#ef4444";
  if (t.insurance_status === "expiring_soon") return "#f97316";
  return "#16a34a";
}

export function BuildingPlan({ siteName, units }: BuildingPlanProps) {
  const [hovered, setHovered] = useState<UnitData | null>(null);
  const [tooltip, setTooltip] = useState({ x: 0, y: 0 });

  const positioned = units.filter(
    (u) =>
      u.position_x != null &&
      u.position_y != null &&
      u.width != null &&
      u.height != null
  );

  if (positioned.length === 0) return null;

  // SVG viewport: 100x70 units
  return (
    <div className="relative">
      {/* Legend */}
      <div className="flex items-center gap-4 mb-3 text-xs text-gray-600 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#bbf7d0] border border-[#16a34a]" />
          Occupé (OK)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#fed7aa] border border-[#f97316]" />
          Attention (bail/assurance)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#fca5a5] border border-[#ef4444]" />
          Alerte (impayé/expiré)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-gray-200 border border-gray-400" />
          Vacant
        </span>
      </div>

      {/* SVG Plan */}
      <div className="relative bg-gray-50 rounded-xl border overflow-hidden">
        <svg
          viewBox="0 0 100 70"
          className="w-full"
          style={{ fontFamily: "inherit" }}
        >
          {/* Background grid lines */}
          <defs>
            <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
              <path d="M 5 0 L 0 0 0 5" fill="none" stroke="#e5e7eb" strokeWidth="0.15" />
            </pattern>
          </defs>
          <rect width="100" height="70" fill="url(#grid)" />

          {/* Units */}
          {positioned.map((unit) => {
            const x = unit.position_x!;
            const y = unit.position_y!;
            const w = unit.width!;
            const h = unit.height!;
            const fill = getUnitColor(unit);
            const stroke = getUnitStroke(unit);
            const isHovered = hovered?.id === unit.id;

            return (
              <g key={unit.id}>
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isHovered ? 0.6 : 0.35}
                  rx={0.4}
                  style={{ cursor: "pointer", transition: "all 0.15s" }}
                  onMouseEnter={(e) => {
                    setHovered(unit);
                    const rect = (e.target as SVGRectElement).closest("svg")!.getBoundingClientRect();
                    setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                  }}
                  onMouseMove={(e) => {
                    const rect = (e.target as SVGRectElement).closest("svg")!.getBoundingClientRect();
                    setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                  }}
                  onMouseLeave={() => setHovered(null)}
                />
                {/* Label (only if wide enough) */}
                {w >= 10 && h >= 8 && (
                  <text
                    x={x + w / 2}
                    y={y + h / 2 - 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={Math.min(w / 8, h / 5, 2.2)}
                    fill={unit.status === "vacant" ? "#6b7280" : "#1f2937"}
                    fontWeight="600"
                    style={{ pointerEvents: "none" }}
                  >
                    {unit.name.split(" - ").pop() || unit.name}
                  </text>
                )}
                {w >= 10 && h >= 10 && unit.tenant && (
                  <text
                    x={x + w / 2}
                    y={y + h / 2 + 2.5}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={Math.min(w / 12, h / 8, 1.6)}
                    fill="#4b5563"
                    style={{ pointerEvents: "none" }}
                  >
                    {unit.tenant.company_name.split(" ")[0]}
                  </text>
                )}
                {unit.status === "vacant" && w >= 10 && h >= 8 && (
                  <text
                    x={x + w / 2}
                    y={y + h / 2 + 2.5}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={Math.min(w / 12, h / 8, 1.5)}
                    fill="#9ca3af"
                    style={{ pointerEvents: "none" }}
                  >
                    VACANT
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {hovered && (
          <div
            className="absolute z-10 pointer-events-none bg-white border rounded-lg shadow-lg p-3 text-xs min-w-[180px]"
            style={{
              left: Math.min(tooltip.x + 8, 300),
              top: Math.max(tooltip.y - 80, 8),
            }}
          >
            <p className="font-semibold text-gray-900 mb-1">{hovered.name}</p>
            <p className="text-gray-500">{hovered.surface} m²</p>
            {hovered.tenant ? (
              <>
                <p className="mt-1 font-medium text-gray-800">{hovered.tenant.company_name}</p>
                <p className="text-gray-500">{hovered.monthly_rent?.toLocaleString("fr-FR")} €/mois</p>
                {hovered.tenant.lease_end && (
                  <p className="text-gray-400 text-[11px]">
                    Bail jusqu&apos;au{" "}
                    {new Date(hovered.tenant.lease_end).toLocaleDateString("fr-FR")}
                  </p>
                )}
                <div className="mt-1.5 flex gap-1 flex-wrap">
                  <PaymentBadge status={hovered.tenant.payment_status} />
                  <InsuranceBadge status={hovered.tenant.insurance_status} />
                </div>
              </>
            ) : (
              <p className="mt-1 text-gray-400 italic">Vacant — disponible</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PaymentBadge({ status }: { status?: string }) {
  const configs: Record<string, { label: string; className: string }> = {
    paid:    { label: "Loyer ✓", className: "bg-emerald-100 text-emerald-700" },
    pending: { label: "En attente", className: "bg-yellow-100 text-yellow-700" },
    overdue: { label: "Impayé !", className: "bg-red-100 text-red-700" },
  };
  const cfg = configs[status || "pending"] || configs.pending;
  return (
    <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium", cfg.className)}>
      {cfg.label}
    </span>
  );
}

function InsuranceBadge({ status }: { status?: string }) {
  const configs: Record<string, { label: string; className: string }> = {
    valid:          { label: "Assurance ✓", className: "bg-emerald-100 text-emerald-700" },
    expiring_soon:  { label: "Assurance ⚠", className: "bg-orange-100 text-orange-700" },
    expired:        { label: "Assurance ✗", className: "bg-red-100 text-red-700" },
    missing:        { label: "Assurance ?", className: "bg-gray-100 text-gray-600" },
  };
  const cfg = configs[status || "missing"] || configs.missing;
  return (
    <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium", cfg.className)}>
      {cfg.label}
    </span>
  );
}
