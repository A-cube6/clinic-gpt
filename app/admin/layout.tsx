import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function getRole() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", auth.user.id)
    .maybeSingle();

  return {
    user: auth.user,
    role: (profile?.role as string | null) ?? null,
    name: (profile?.full_name as string | null) ?? null,
  };
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await getRole();

  // If middleware let you through but profile/role is missing, send to admin login.
  if (!me?.user) redirect("/admin/login");

  // Allow only staff for now
  const allowed = me.role === "owner" || me.role === "reception";
  if (!allowed) redirect("/");

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="text-sm font-bold text-slate-900">Clinic Admin</div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700">
              {me.role}
            </span>
          </div>
          <nav className="flex items-center gap-3 text-sm">
            <Link className="rounded-xl px-3 py-2 font-semibold text-slate-700 hover:bg-slate-50" href="/admin">
              Dashboard
            </Link>
            <Link className="rounded-xl px-3 py-2 font-semibold text-slate-700 hover:bg-slate-50" href="/">
              Back to site
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
