"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Target,
  Wallet,
  Building2,
  Megaphone,
  Settings,
  LogOut,
  HelpCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  roles: string[];
  badge?: string | number | null;
  soon?: boolean;
};

const menuNav: NavItem[] = [
  {
    label: "Vue d'ensemble",
    href: "/",
    icon: LayoutDashboard,
    roles: ["admin", "direction", "commercial", "immo", "compta"],
  },
  {
    label: "Commercial",
    href: "/commercial",
    icon: Target,
    roles: ["admin", "direction", "commercial"],
  },
  {
    label: "Finance",
    href: "/finance",
    icon: Wallet,
    roles: ["admin", "direction", "compta"],
  },
  {
    label: "Immobilier",
    href: "/immobilier",
    icon: Building2,
    roles: ["admin", "direction", "immo"],
  },
  {
    label: "Régie TJM",
    href: "/tjm",
    icon: Megaphone,
    roles: ["admin", "direction"],
    soon: true,
  },
];

const supportNav: NavItem[] = [
  {
    label: "Paramètres",
    href: "/settings",
    icon: Settings,
    roles: ["admin", "direction", "commercial", "immo", "compta"],
  },
  {
    label: "Aide",
    href: "/help",
    icon: HelpCircle,
    roles: ["admin", "direction", "commercial", "immo", "compta"],
    soon: true,
  },
];

interface SidebarProps {
  userRole?: string;
  userName?: string;
  userEmail?: string;
}

function NavGroup({
  label,
  items,
  userRole,
  pathname,
}: {
  label: string;
  items: NavItem[];
  userRole: string;
  pathname: string;
}) {
  const visible = items.filter((i) => i.roles.includes(userRole));
  if (!visible.length) return null;

  return (
    <div className="mb-5">
      <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
        {label}
      </p>
      <div className="space-y-0.5">
        {visible.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.soon ? "#" : item.href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-[#3b5ef5] text-white shadow-sm shadow-[#3b5ef5]/30"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-800",
                item.soon && "opacity-40 pointer-events-none"
              )}
            >
              <item.icon
                className={cn(
                  "w-[18px] h-[18px] flex-shrink-0 transition-colors",
                  isActive
                    ? "text-white"
                    : "text-gray-400 group-hover:text-gray-600"
                )}
              />
              <span className="flex-1 leading-none">{item.label}</span>
              {item.soon && (
                <span className="text-[9px] font-semibold tracking-wide bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-md">
                  SOON
                </span>
              )}
              {item.badge != null && (
                <span className="text-[11px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-none">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function Sidebar({
  userRole = "commercial",
  userName,
  userEmail,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "LV";

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-white border-r border-gray-100 flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#3b5ef5] flex items-center justify-center flex-shrink-0">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-4 h-4 text-white"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">
              LVIF Group
            </p>
            <p className="text-[11px] text-gray-400 leading-tight">
              Control Center
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 overflow-y-auto">
        <NavGroup
          label="Menu"
          items={menuNav}
          userRole={userRole}
          pathname={pathname}
        />
        <NavGroup
          label="Support"
          items={supportNav}
          userRole={userRole}
          pathname={pathname}
        />
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors group">
          <div className="w-8 h-8 rounded-full bg-[#3b5ef5] flex items-center justify-center flex-shrink-0">
            <span className="text-[11px] font-bold text-white">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate leading-tight">
              {userName || "Utilisateur"}
            </p>
            <p className="text-[11px] text-gray-400 truncate leading-tight mt-0.5">
              {userEmail || ""}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
            title="Déconnexion"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
