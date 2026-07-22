/**
 * Where to land after a successful sign-in.
 *
 * It travels in a cookie rather than in `redirectTo`, because Supabase matches
 * its Redirect-URL allow-list against the *entire* URL, query string included:
 * a registered `/auth/callback` does not match `/auth/callback?next=%2F`.
 */
export const NEXT_COOKIE = "ap_next";

/** Client-side only. `maxAge` is in seconds. */
export function rememberNext(path: string, maxAge = 600) {
  const safe = path.startsWith("/") ? path : "/";
  document.cookie = `${NEXT_COOKIE}=${encodeURIComponent(safe)}; path=/; max-age=${maxAge}; samesite=lax`;
}
