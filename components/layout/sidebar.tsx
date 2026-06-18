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
  ChevronRight,
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

const nav: NavItem[] = [
  {
    label: "Vue d'ensemble",
    href: "/",
    icon: LayoutDashboard,
    roles: ["admin", "direction", "commercial", "immo", "compta"],
  },
  {
    label: "Actions Commerciales",
    href: "/commercial",
    icon: Target,
    roles: ["admin", "direction", "commercial"],
    badge: null, // rempli dynamiquement
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

interface SidebarProps {
  userRole?: string;
  userName?: string;
  userEmail?: string;
}

export function Sidebar({ userRole = "commercial", userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const visibleNav = nav.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--sidebar-border))]">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[hsl(var(--sidebar-border))]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">LVIF Group</p>
            <p className="text-xs text-[hsl(var(--sidebar-foreground))]/50">Control Center</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {visibleNav.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.soon ? "#" : item.href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-brand-600 text-white"
                  : "text-[hsl(var(--sidebar-foreground))]/70 hover:bg-[hsl(var(--sidebar-accent))] hover:text-white",
                item.soon && "opacity-50 cursor-not-allowed"
              )}
            >
              <item.icon className={cn("w-4.5 h-4.5 flex-shrink-0", isActive ? "text-white" : "text-[hsl(var(--sidebar-foreground))]/50 group-hover:text-white")} />
              <span className="flex-1">{item.label}</span>
              {item.soon && (
                <span className="text-[10px] font-medium bg-white/10 text-white/60 px-1.5 py-0.5 rounded">
                  Bientôt
                </span>
              )}
              {item.badge && (
                <span className="text-[11px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {item.badge}
                </span>
              )}
              {isActive && !item.soon && (
                <ChevronRight className="w-3.5 h-3.5 text-white/60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer user */}
      <div className="px-3 pb-4 border-t border-[hsl(var(--sidebar-border))] pt-3 space-y-0.5">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[hsl(var(--sidebar-foreground))]/70 hover:bg-[hsl(var(--sidebar-accent))] hover:text-white transition-all"
        >
          <Settings className="w-4.5 h-4.5 text-[hsl(var(--sidebar-foreground))]/50" />
          Paramètres
        </Link>

        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">
              {userName ? userName.charAt(0).toUpperCase() : "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{userName || "Utilisateur"}</p>
            <p className="text-[11px] text-[hsl(var(--sidebar-foreground))]/40 truncate">{userEmail || ""}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded hover:bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-foreground))]/40 hover:text-white transition"
            title="Déconnexion"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
