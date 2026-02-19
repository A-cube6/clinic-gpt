import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function getRole() {
  const supabase = await createSupabaseServerClient();
  const { data: auth, error } = await supabase.auth.getUser();

  if (error || !auth?.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle();

  return (profile?.role as string | null) ?? null;
}

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const role = await getRole();

  // Only allow staff roles into protected admin routes.
  if (role !== "owner" && role !== "reception") {
    redirect("/admin/login");
  }

  return <>{children}</>;
}
