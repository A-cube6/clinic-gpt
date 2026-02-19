import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";

type CookiePair = { name: string; value: string };

function parseCookieHeader(raw: string | null): CookiePair[] {
  if (!raw) return [];
  // "a=1; b=2" -> [{name:"a",value:"1"}, ...]
  return raw
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const eq = part.indexOf("=");
      if (eq === -1) return { name: part, value: "" };
      const name = part.slice(0, eq).trim();
      const value = part.slice(eq + 1).trim();
      return { name, value };
    })
    .filter((c) => c.name.length > 0);
}

/**
 * Server client for Server Components + Route Handlers.
 *
 * Why this implementation?
 * Next.js cookieStore APIs differ across versions/runtimes (some have getAll(), some don't).
 * Using the raw "cookie" header is the most compatible way to return *all* cookies.
 */
export async function createSupabaseServerClient() {
  // `cookies()` and `headers()` are async in modern Next.js runtimes.
  // Awaiting is safe even if they are sync in a particular runtime.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cookieStore: any = await (cookies() as any);
  const headerStore = await headers();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Prefer parsing the Cookie header for maximum compatibility
          const raw = headerStore.get("cookie");
          return parseCookieHeader(raw);
        },
        setAll(cookiesToSet) {
          // In Server Components cookieStore is readonly; in Route Handlers it can be mutable.
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore?.set?.(name, value, options);
            });
          } catch {
            // no-op
          }
        },
      },
    }
  );
}
