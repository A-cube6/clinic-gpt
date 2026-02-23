"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function ResetPasswordPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  // When user opens the reset link, Supabase puts a recovery session in the URL hash.
  // The browser client will pick it up automatically.
  useEffect(() => {
    // tiny readiness delay so UI doesn't flash
    setReady(true);
  }, []);

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setLoading(false);
      setMsg("Reset link is invalid or expired. Please request a new reset email.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("Password updated successfully. Redirecting to admin login...");
    setTimeout(() => router.push("/admin/login"), 700);
  };

  if (!ready) return null;

  return (
    <main className="mx-auto max-w-md px-4 py-14">
      <h1 className="text-2xl font-bold text-slate-900">Reset password</h1>
      <p className="mt-2 text-sm text-slate-600">
        Enter a new password for your account.
      </p>

      <form
        onSubmit={updatePassword}
        className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <label className="block">
          <div className="mb-1 text-xs font-semibold text-slate-700">New password</div>
          <input
            type="password"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-200"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            minLength={8}
            required
          />
        </label>

        <button
          disabled={loading}
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "Updating..." : "Update password"}
        </button>

        {msg ? <div className="text-sm text-slate-700">{msg}</div> : null}
      </form>
    </main>
  );
}