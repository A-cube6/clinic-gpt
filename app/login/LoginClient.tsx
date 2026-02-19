"use client";

import { useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginClient() {
  const sp = useSearchParams();
  const nextPath = sp.get("next") || "/";
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <main className="mx-auto max-w-md px-4 py-14">
      <h1 className="text-2xl font-bold text-slate-900">Login</h1>
      <p className="mt-2 text-sm text-slate-600">Continue with Google to proceed.</p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <Auth
          supabaseClient={supabase}
          providers={["google"]}
          onlyThirdPartyProviders
          redirectTo={`${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: "#0f172a", // slate-900
                  brandAccent: "#111827", // slate-900/800-ish
                },
                radii: {
                  borderRadiusButton: "12px",
                  buttonBorderRadius: "12px",
                  inputBorderRadius: "12px",
                },
              },
            },
          }}
        />
      </div>
    </main>
  );
}
