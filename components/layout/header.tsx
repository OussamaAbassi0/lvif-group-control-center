"use client";

import { Bell, RefreshCw } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  lastUpdated?: string;
  onRefresh?: () => void;
}

export function Header({ title, subtitle, lastUpdated, onRefresh }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b bg-white">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {lastUpdated && (
          <span className="text-xs text-gray-400">
            Mis à jour : {lastUpdated}
          </span>
        )}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition"
            title="Actualiser"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
        <button
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition relative"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {/* Badge notifications — actif quand il y en a */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
      </div>
    </header>
  );
}
