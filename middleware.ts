import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

const PROTECTED_PREFIXES = ["/akaunt", "/profil"];

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // No backend configured yet — let everything through.
  if (!url || !anon) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // ---- Admin area: require a signed-in user whose profile.is_admin is true.
  // Non-admins (and guests) are bounced to the homepage silently.
  if (path.startsWith("/admin")) {
    // Not signed in → send to the login page and remember where we were headed,
    // so the PWA returns to /admin (or the deep-linked admin page) after login
    // instead of dumping the user on the public storefront.
    if (!user) {
      const login = request.nextUrl.clone();
      login.pathname = "/vlez";
      login.search = "";
      login.searchParams.set("redirect", path);
      return NextResponse.redirect(login);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.is_admin) return NextResponse.redirect(new URL("/", request.url));
    return response;
  }

  const needsAuth = PROTECTED_PREFIXES.some((p) => path.startsWith(p));

  if (needsAuth && !user) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/vlez";
    redirect.searchParams.set("redirect", path);
    return NextResponse.redirect(redirect);
  }

  return response;
}

export const config = {
  matcher: [
    // Run on all routes except static assets and image optimisation.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
