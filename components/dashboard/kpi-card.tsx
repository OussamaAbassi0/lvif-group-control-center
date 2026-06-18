import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: {
    value: number;
    label?: string;
    direction: "up" | "down" | "neutral";
    positive?: boolean;
  };
  alert?: boolean;
  className?: string;
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-[#3b5ef5]",
  iconBg = "bg-[#3b5ef5]/10",
  trend,
  alert,
  className,
}: KpiCardProps) {
  const trendIsGood =
    trend?.direction === "neutral"
      ? null
      : trend?.direction === "up"
      ? trend.positive !== false
      : trend?.positive === false;

  return (
    <div
      className={cn(
        "bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-4 hover:border-gray-200 hover:shadow-sm transition-all duration-150",
        alert && "border-red-100 bg-red-50/20",
        className
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between">
        {Icon && (
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
              alert ? "bg-red-100" : iconBg
            )}
          >
            <Icon
              className={cn(
                "w-[18px] h-[18px]",
                alert ? "text-red-500" : iconColor
              )}
            />
          </div>
        )}
        <p className="text-xs font-medium text-gray-500 text-right leading-tight flex-1 ml-3">
          {title}
        </p>
      </div>

      {/* Value + trend */}
      <div>
        <div className="flex items-end gap-2.5">
          <p
            className={cn(
              "text-2xl font-bold tracking-tight leading-none",
              alert ? "text-red-600" : "text-gray-900"
            )}
          >
            {value}
          </p>
          {trend && (
            <span
              className={cn(
                "inline-flex items-center text-[11px] font-semibold px-1.5 py-0.5 rounded-md mb-0.5",
                trendIsGood === null
                  ? "bg-gray-100 text-gray-500"
                  : trendIsGood
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-red-50 text-red-600"
              )}
            >
              {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→"}
              {" "}{Math.abs(trend.value)}%
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-[11px] text-gray-400 mt-1.5 leading-tight">{subtitle}</p>
        )}
        {trend?.label && (
          <p className="text-[11px] text-gray-400 mt-0.5">{trend.label}</p>
        )}
      </div>
    </div>
  );
}
