import { Suspense } from "react";
import LoginClient from "./LoginClient";

export const dynamic = "force-dynamic";

/**
 * Next.js requirement:
 * Any usage of useSearchParams() must be wrapped in a Suspense boundary.
 * Keep the page as a Server Component and render the Client component inside Suspense.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-14 text-sm text-slate-600">Loading…</div>}>
      <LoginClient />
    </Suspense>
  );
}
