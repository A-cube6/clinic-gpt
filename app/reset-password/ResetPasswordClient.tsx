"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function ResetPasswordClient() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const sp = useSearchParams();

  const code = sp.get("code"); // PKCE flow
  const tokenHash = sp.get("token_hash"); // OTP flow
  const type = sp.get("type"); // usually "recovery"

  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Validating reset link…");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setMsg(null);
      setReady(false);

      // 1) PKCE flow: /reset-password?code=...
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;

        if (error) {
          setStatus("Reset link invalid/expired (code exchange failed).");
          setMsg(error.message);
          return;
        }

        setStatus("Link verified ✅ Set a new password.");
        setReady(true);
        return;
      }

      // 2) OTP flow: /reset-password?token_hash=...&type=recovery
      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as any,
        });

        if (cancelled) return;

        if (error) {
          setStatus("Reset link invalid/expired (OTP verify failed).");
          setMsg(error.message);
          return;
        }

        setStatus("Link verified ✅ Set a new password.");
        setReady(true);
        return;
      }

      // 3) Older hash flow: /reset-password#access_token=...&type=recovery
      // Supabase client often auto-detects hash tokens. We just check if user exists.
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;

      if (!data.user) {
        setStatus("Reset link invalid/expired (no session found).");
        setMsg("Request a new reset link from the login page.");
        return;
      }

      setStatus("Link verified ✅ Set a new password.");
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [code, tokenHash, type, supabase]);

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setLoading(false);
      setMsg("Session missing. Please request a new reset link.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    setStatus("Password updated ✅ Redirecting to login…");
    setTimeout(() => router.push("/staff/login"), 800);
  };

  return (
    <main className="mx-auto max-w-md px-4 py-14">
      <h1 className="text-2xl font-bold text-slate-900">Reset password</h1>
      <p className="mt-2 text-sm text-slate-600">{status}</p>

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
            placeholder="Minimum 8 characters"
            minLength={8}
            required
            disabled={!ready || loading}
          />
        </label>

        <button
          disabled={!ready || loading}
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "Updating…" : "Update password"}
        </button>

        {msg ? <div className="text-sm text-red-600">{msg}</div> : null}
      </form>
    </main>
  );
}