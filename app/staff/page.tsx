"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function StaffDashboard(){
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();

  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [status, setStatus] = useState("Checking…");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/staff/login?next=/staff");
        return;
      }

      setEmail(data.user.email ?? null);

      const { data: staff, error } = await supabase
        .from("staff_profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      if (error) {
        setStatus("Logged in, but role lookup failed: " + error.message);
        return;
      }

      const r = staff?.role;

if (!r) {
  setStatus("Logged in, but NOT staff. Access denied.");
  await supabase.auth.signOut();
  router.push("/staff/login");
  return;
}

if (r === "owner") {
  router.push("/admin");
  return;
}

if (r !== "reception") {
  setStatus("Access denied.");
  await supabase.auth.signOut();
  router.push("/staff/login");
  return;
}

      setRole(staff.role);
      setStatus("Authenticated ✅");
    })();
  }, [router, supabase]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/staff/login");
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-2xl font-bold text-slate-900">Reception Dashboard</h1>
      <p className="mt-2 text-sm text-slate-600">{status}</p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-sm font-semibold text-slate-900">Signed in as</div>
        <div className="mt-1 text-sm text-slate-700">{email ?? "—"}</div>

        <div className="mt-4 text-sm font-semibold text-slate-900">Role</div>
        <div className="mt-1 text-sm text-slate-700">{role ?? "—"}</div>

        <button
          onClick={logout}
          className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Logout
        </button>
      </div>
    </main>
  );
}