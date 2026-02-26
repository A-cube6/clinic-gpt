import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * TEMPORARY SITE LOCK (production only)
 * - Only applies on https://clinic-gpt-ten.vercel.app
 * - Does NOT apply on localhost
 * - Requires an authenticated Supabase user with role = 'owner' (from public.profiles)
 *
 * Also keeps Supabase auth cookies in sync for SSR, and protects /admin and /staff routes.
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  // Detect hostname reliably (strip port)
  const hostHeader = request.headers.get("host") ?? "";
  const hostname = hostHeader.split(":")[0].toLowerCase();

  const isLocalhost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname.endsWith(".localhost");

  // Lock ONLY this production URL (not preview deployments)
  const isLockedProdHost = !isLocalhost && hostname === "clinic-gpt-ten.vercel.app";

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session if it exists (or keep as anonymous)
  const { data } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAdminLogin = pathname === "/admin/login";
  const isStaffLogin = pathname === "/staff/login";
  const isAuthCallback = pathname.startsWith("/auth/callback");
  const isResetPassword = pathname.startsWith("/reset-password");

  // ------------------------------
  // 1) TEMP SITE LOCK (prod only)
  // ------------------------------
  if (isLockedProdHost) {
    // Allow login & auth callback routes without already being logged in
    // (Reset-password is allowed so the admin doesn't get locked out.)
    if (!isAdminLogin && !isAuthCallback && !isResetPassword) {
      if (!data.user) {
        const url = request.nextUrl.clone();
        url.pathname = "/admin/login";
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
      }

      // Only the admin/owner can access the site while locked
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      const role = (profile?.role as string | null) ?? null;
      if (role !== "owner") {
        const url = request.nextUrl.clone();
        url.pathname = "/admin/login";
        url.searchParams.set("next", pathname);
        url.searchParams.set("reason", "owner_only");
        return NextResponse.redirect(url);
      }
    }

    // If locked + owner is logged in, allow everything
    return response;
  }

  // ----------------------------------
  // 2) Normal route protection (dev/other)
  // ----------------------------------
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isStaffRoute = pathname === "/staff" || pathname.startsWith("/staff/");

  if (isAdminRoute && !isAdminLogin) {
    if (!data.user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (isStaffRoute && !isStaffLogin && !data.user) {
    const url = request.nextUrl.clone();
    url.pathname = "/staff/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
