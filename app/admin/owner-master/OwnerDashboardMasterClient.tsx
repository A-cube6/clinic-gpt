"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import OwnerDashboardMasterDetail from "@/components/admin/owner-dashboard-master-detail";

export default function OwnerDashboardMasterClient() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "ready" | "denied">("checking");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/admin/login?next=/admin/owner-master");
        return;
      }
      setEmail(data.user.email ?? null);

      const { data: staff, error } = await supabase
        .from("staff_profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      if (error) {
        console.error("Owner role lookup failed:", error);
        setStatus("denied");
        return;
      }

      if (staff?.role !== "owner") {
        setStatus("denied");
        return;
      }

      setStatus("ready");
    })();
  }, [router, supabase]);

  if (status === "checking") {
    return (
      <main className="mx-auto max-w-6xl px-4 py-14">
        <h1 className="text-2xl font-bold text-slate-900">Owner dashboard v2</h1>
        <p className="mt-2 text-sm text-slate-600">Loading…</p>
      </main>
    );
  }

  if (status === "denied") {
    return (
      <main className="mx-auto max-w-6xl px-4 py-14">
        <h1 className="text-2xl font-bold text-slate-900">Access restricted</h1>
        <p className="mt-2 text-sm text-slate-600">This page is for the clinic owner only.</p>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-700">
            Signed in as: <span className="font-semibold">{email ?? "—"}</span>
          </div>
          <button
            className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => router.push("/")}
          >
            Go back to website
          </button>
        </div>
      </main>
    );
  }

  return <OwnerDashboardMasterDetail />;
}
