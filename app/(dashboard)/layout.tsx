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

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, email")
    .eq("id", user.id)
    .single();

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#0c0c0d" }}>
      <Sidebar
        userRole={profile?.role || "commercial"}
        userName={profile?.full_name || user.email?.split("@")[0]}
        userEmail={profile?.email || user.email}
      />
      <main style={{ flex: 1, overflowY: "auto", background: "#0c0c0d" }}>
        {children}
      </main>
    </div>
  );
}
