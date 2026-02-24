import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Keeps Supabase auth cookies in sync for SSR.
 * Also blocks /admin/* routes for non-authenticated users (role checks happen in the admin layout).
 *
 * Docs: https://supabase.com/docs/guides/auth/server-side
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

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

  // Basic protection: require login for admin routes (except /admin/login)
  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminLogin = pathname === "/admin/login";

  const isStaffRoute = pathname === "/staff" || pathname.startsWith("/staff/");
const isStaffLogin = pathname === "/staff/login";

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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
