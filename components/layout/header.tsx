"use client";

import { Bell, Search, RefreshCw } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  lastUpdated?: string;
  onRefresh?: () => void;
}

export function Header({ title, subtitle, lastUpdated, onRefresh }: HeaderProps) {
  const today = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-7 py-4 bg-white border-b border-gray-100">
      {/* Left — title */}
      <div>
        <h1 className="text-base font-semibold text-gray-900 leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 w-52">
          <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Rechercher…"
            className="bg-transparent text-xs text-gray-600 placeholder-gray-400 outline-none w-full"
          />
        </div>

        {/* Date chip */}
        <div className="hidden lg:flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
          <span className="text-xs text-gray-500 font-medium">{today}</span>
        </div>

        {/* Refresh */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
            title="Actualiser"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {/* Bell */}
        <button className="relative p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full ring-1 ring-white" />
        </button>

        {/* Last updated */}
        {lastUpdated && (
          <span className="text-[11px] text-gray-400 hidden xl:block">{lastUpdated}</span>
        )}
      </div>
    </header>
  );
}
