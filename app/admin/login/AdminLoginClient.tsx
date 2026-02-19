"use client";

import { createClient } from "@supabase/supabase-js";
import { useSearchParams } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminLoginClient() {
  const sp = useSearchParams();
  const nextPath = sp.get("next") || "/admin";

  const signInWithGoogle = async () => {
    const origin = window.location.origin;

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // After auth, our /auth/callback handler should redirect to `next`
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });
  };

  return (
    <main className="mx-auto max-w-md px-4 py-14">
      <h1 className="text-2xl font-bold text-slate-900">Admin login</h1>
      <p className="mt-2 text-sm text-slate-600">Owner / Reception access only.</p>

      <button
        onClick={signInWithGoogle}
        className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Continue with Google
      </button>

      <p className="mt-4 text-xs text-slate-500">
        If you don’t have access, ask the clinic owner to add your role in Supabase.
      </p>
    </main>
  );
}
