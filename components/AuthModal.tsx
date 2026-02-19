"use client";

import React from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  nextPath?: string;
};

export default function AuthModal({ open, onClose, title = "Sign in", nextPath = "/" }: Props) {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <button className="absolute inset-0" onClick={onClose} aria-label="Close sign in" />
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-bold text-slate-900">{title}</div>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-slate-50"
            type="button"
          >
            Close
          </button>
        </div>

        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={["google"]}
          redirectTo={`${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback?next=${encodeURIComponent(nextPath)}`}
          view="sign_in"
        />

        <p className="mt-3 text-xs text-slate-500">
          Tip: For India, email + Google login is simplest on Free tier. Phone OTP requires an SMS provider & costs.
        </p>
      </div>
    </div>
  );
}
