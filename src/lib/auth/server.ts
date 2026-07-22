import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { config, isAuthConfigured, isEmailAllowed } from "@/lib/config";

/**
 * Server-side Supabase client bound to the request cookies, for reading the
 * signed-in user inside Server Components and Route Handlers.
 */
export async function getServerAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(config.supabase.url, config.supabase.anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component: the middleware refreshes the
          // session cookies instead, so this is safe to ignore.
        }
      },
    },
  });
}

/** The signed-in, allow-listed user — or null. */
export async function getCurrentUser() {
  if (!isAuthConfigured()) return null;
  const supabase = await getServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isEmailAllowed(user.email)) return null;
  return user;
}
