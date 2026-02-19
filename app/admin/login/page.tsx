"use client";

import React from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export const dynamic = "force-dynamic";


export default function AdminLogin() {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const sp = useSearchParams();
  const next = sp.get("next") ?? "/admin";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-2xl font-bold text-slate-900">Admin Login</h1>
        <p className="mt-2 text-sm text-slate-600">For clinic staff (Owner + Reception).</p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={["google"]}
            redirectTo={`${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback?next=${encodeURIComponent(next)}`}
            view="sign_in"
          />
        </div>

        <p className="mt-4 text-xs text-slate-500">
          Note: Role enforcement happens after login via the <code>profiles.role</code> field (owner/reception).
        </p>
      </div>
    </div>
  );
}
