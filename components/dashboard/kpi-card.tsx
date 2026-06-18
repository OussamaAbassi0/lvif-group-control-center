import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: {
    value: number;
    label?: string;
    direction: "up" | "down" | "neutral";
    positive?: boolean; // up = bon ou up = mauvais selon le KPI
  };
  alert?: boolean;
  className?: string;
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-brand-600",
  trend,
  alert,
  className,
}: KpiCardProps) {
  const trendColor =
    trend?.direction === "neutral"
      ? "text-gray-500"
      : trend?.direction === "up"
      ? trend.positive !== false
        ? "text-emerald-600"
        : "text-red-600"
      : trend?.positive !== false
      ? "text-red-600"
      : "text-emerald-600";

  const trendArrow = trend?.direction === "up" ? "↑" : trend?.direction === "down" ? "↓" : "→";

  return (
    <div
      className={cn(
        "bg-white rounded-xl border p-5 flex flex-col gap-3 hover:shadow-md transition-shadow",
        alert && "border-red-200 bg-red-50/30",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-gray-600 leading-tight">{title}</p>
        {Icon && (
          <div className={cn("p-2 rounded-lg bg-gray-50", alert && "bg-red-100")}>
            <Icon className={cn("w-4 h-4", alert ? "text-red-600" : iconColor)} />
          </div>
        )}
      </div>

      <div>
        <p className={cn("text-2xl font-bold text-gray-900", alert && "text-red-700")}>
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>

      {trend && (
        <div className={cn("flex items-center gap-1 text-xs font-medium", trendColor)}>
          <span>{trendArrow}</span>
          <span>
            {trend.value > 0 ? "+" : ""}
            {trend.value}%
          </span>
          {trend.label && <span className="text-gray-400 font-normal">{trend.label}</span>}
        </div>
      )}
    </div>
  );
}
