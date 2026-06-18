import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Récupérer le profil complet avec le rôle
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, email")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f8fc]">
      <Sidebar
        userRole={profile?.role || "commercial"}
        userName={profile?.full_name || user.email?.split("@")[0]}
        userEmail={profile?.email || user.email}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
