import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { config as appConfig, isAuthConfigured, isEmailAllowed } from "@/lib/config";

/** Routes reachable without a session (the sign-in flow itself). */
const PUBLIC_PATHS = [
  "/login",
  "/auth/callback",
  "/auth/reset-password",
  "/auth/signout",
  "/robots.txt",
  "/ai.txt",
  "/llms.txt",
];

const isPublic = (pathname: string) =>
  PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Every response gets the "do not index, do not train" header, including the
  // public ones — this is belt-and-braces alongside robots.txt and <meta>.
  const withNoIndex = (res: NextResponse) => {
    res.headers.set(
      "X-Robots-Tag",
      "noindex, nofollow, noarchive, nosnippet, noimageindex, noai, noimageai"
    );
    return res;
  };

  // Not configured yet (credentials pending): stay usable locally rather than
  // locking the owner out of their own app.
  if (!isAuthConfigured() || isPublic(pathname)) {
    return withNoIndex(NextResponse.next());
  }

  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    appConfig.supabase.url,
    appConfig.supabase.anonKey,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          toSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() revalidates the token with Supabase — do not trust getSession()
  // in middleware, its cookie payload is not verified.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const authorised = Boolean(user && isEmailAllowed(user.email));

  if (!authorised) {
    if (pathname.startsWith("/api/")) {
      return withNoIndex(
        NextResponse.json({ error: "Não autenticado." }, { status: 401 })
      );
    }
    const loginUrl = new URL("/login", req.url);
    if (pathname !== "/") loginUrl.searchParams.set("next", pathname);
    if (user) loginUrl.searchParams.set("error", "not_allowed");
    return withNoIndex(NextResponse.redirect(loginUrl));
  }

  return withNoIndex(res);
}

export const config = {
  matcher: [
    /*
     * Everything except Next.js internals and static files — the app itself,
     * plus all API routes.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
