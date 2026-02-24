"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function StaffLoginClient() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const sp = useSearchParams();

  const nextPath = sp.get("next") || "/staff";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    // Decide route based on role
    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id;

    if (!uid) {
      router.push("/staff/login");
      return;
    }

    const { data: staff } = await supabase
      .from("staff_profiles")
      .select("role")
      .eq("id", uid)
      .maybeSingle();

    const role = staff?.role;

    if (role === "owner") router.push("/admin");
    else if (role === "reception") router.push(nextPath);
    else {
      setMsg("Access denied. This account is not staff.");
      await supabase.auth.signOut();
    }
  };

  return (
    <main className="mx-auto max-w-md px-4 py-14">
      <h1 className="text-2xl font-bold text-slate-900">Staff login</h1>
      <p className="mt-2 text-sm text-slate-600">Reception access.</p>

      <form
        onSubmit={signIn}
        className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <label className="block">
          <div className="mb-1 text-xs font-semibold text-slate-700">Email</div>
          <input
            type="email"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-200"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="block">
          <div className="mb-1 text-xs font-semibold text-slate-700">Password</div>
          <input
            type="password"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-200"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        {msg ? <div className="text-sm text-red-600">{msg}</div> : null}
      </form>
    </main>
  );
}