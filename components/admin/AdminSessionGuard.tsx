"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient, isSupabaseConfiguredClient } from "@/lib/supabase/client";

/**
 * Client-side session guard for the admin PWA.
 *
 * The server layout already gates /admin on every network request, but a
 * standalone PWA can keep running long after its Supabase session has expired —
 * e.g. resumed from the background, or an offline admin page served straight
 * from the service-worker cache. This watches the live session and bounces to
 * the login page (preserving the current path via ?redirect=) the moment it
 * goes away, so the app never sits on a stale, signed-out admin screen.
 *
 * Renders nothing.
 */
export function AdminSessionGuard() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isSupabaseConfiguredClient()) return;
    const supabase = createClient();
    let active = true;

    const toLogin = () => {
      const next = pathname?.startsWith("/admin") ? pathname : "/admin";
      router.replace(`/vlez?redirect=${encodeURIComponent(next)}`);
    };

    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (active && !data.session) toLogin();
    };

    // Initial check — catches an offline/cached admin shell with no live session.
    check();

    // Live updates — fires on token-refresh failure and explicit sign-out.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active && !session) toLogin();
    });

    // Re-validate whenever the PWA returns to the foreground.
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      active = false;
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router, pathname]);

  return null;
}
