"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { ReactElement } from "react";

interface SidebarProps {
  userRole?: string;
  userName?: string;
  userEmail?: string;
}

function MenuIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path d="M4 6h16M4 12h11M4 18h7" stroke="#C5F73A" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function HomeIcon({ active }: { active?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M3 11l9-8 9 8M5 10v9a1 1 0 001 1h12a1 1 0 001-1v-9"
        stroke={active ? "#0c0c0d" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function TargetIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}
function WalletIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <path d="M19 7h-1V6a3 3 0 00-3-3H6a3 3 0 00-3 3v9a3 3 0 003 3h9a3 3 0 003-3v-1h1a2 2 0 002-2V9a2 2 0 00-2-2zm-3 4.5a1 1 0 110-2 1 1 0 010 2z"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
function BuildingIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <path d="M9 20l-5.5 2.5V6L9 3.5m0 16.5l6-2.5m-6 2.5V3.5m6 14l5.5 2.5V6L15 3.5m0 14V3.5m-6 0l6 2.5"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <path d="M4 19V9m5 10V5m5 14v-7m5 7V8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function SettingsIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-2.82 1.17V21a2 2 0 11-4 0v-.09A1.65 1.65 0 007 19.74a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function HelpIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9.5 9.5a2.5 2.5 0 014.9.7c0 1.7-2.5 2.3-2.5 2.3M12 16h.01"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface NavEntry {
  href: string;
  Icon: (props: { active?: boolean }) => ReactElement;
  roles: string[];
  label: string;
  isHome?: boolean;
  soon?: boolean;
}

const nav: NavEntry[] = [
  { href: "/",           Icon: HomeIcon,     roles: ["admin","direction","commercial","immo","compta"], label: "Accueil",    isHome: true },
  { href: "/commercial", Icon: TargetIcon,   roles: ["admin","direction","commercial"],                 label: "Commercial" },
  { href: "/finance",    Icon: WalletIcon,   roles: ["admin","direction","compta"],                     label: "Finance" },
  { href: "/immobilier", Icon: BuildingIcon, roles: ["admin","direction","immo"],                       label: "Immobilier" },
  { href: "/tjm",        Icon: ChartIcon,    roles: ["admin","direction"],                              label: "Regie TJM", soon: true },
];

export function Sidebar({ userRole = "commercial" }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const visibleNav = nav.filter((item) => item.roles.includes(userRole));

  return (
    <aside style={{
      width: 74, flexShrink: 0, display: "flex", flexDirection: "column",
      alignItems: "center", padding: "26px 0", gap: 26,
      borderRight: "1px solid rgba(255,255,255,0.04)", background: "#0c0c0d",
    }}>
      <MenuIcon />
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, marginTop:14, flex:1 }}>
        {visibleNav.map(({ href, Icon, label, soon, isHome }) => {
          const isActive = isHome ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link key={href} href={soon ? "#" : href} title={label} style={{
              width:42, height:42, borderRadius:13,
              display:"flex", alignItems:"center", justifyContent:"center",
              background: isActive ? "#C5F73A" : "transparent",
              color: isActive ? "#0c0c0d" : "#6b6b70",
              boxShadow: isActive ? "0 6px 18px rgba(197,247,58,0.3)" : "none",
              transition:"all 0.15s", textDecoration:"none",
              opacity: soon ? 0.4 : 1,
              cursor: soon ? "not-allowed" : "pointer",
            }}>
              <Icon active={isActive} />
            </Link>
          );
        })}
      </div>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
        {[
          { icon: <SettingsIcon />, label: "Parametres" },
          { icon: <HelpIcon />,     label: "Aide" },
        ].map(({ icon, label }) => (
          <button key={label} title={label} style={{
            width:42, height:42, borderRadius:13,
            display:"flex", alignItems:"center", justifyContent:"center",
            background:"transparent", color:"#6b6b70", border:"none", cursor:"pointer",
          }}>{icon}</button>
        ))}
        <button onClick={handleLogout} title="Deconnexion" style={{
          width:42, height:42, borderRadius:13,
          display:"flex", alignItems:"center", justifyContent:"center",
          background:"transparent", color:"#6b6b70", border:"none", cursor:"pointer",
        }}><LogoutIcon /></button>
      </div>
    </aside>
  );
}
