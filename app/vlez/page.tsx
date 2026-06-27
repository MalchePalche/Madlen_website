import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Вход", robots: { index: false } };

/** Only allow same-origin, absolute internal paths as a post-login target. */
function safeRedirect(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && /^\/(?![/\\])/.test(raw) ? raw : "/akaunt";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string | string[] };
}) {
  if (isSupabaseConfigured()) {
    const {
      data: { user },
    } = await createClient().auth.getUser();
    // Already signed in → skip the form and go straight to the requested target
    // (e.g. an admin reopening the PWA lands on /admin, not /akaunt).
    if (user) redirect(safeRedirect(searchParams.redirect));
  }
  return (
    <AuthShell>
      <Suspense fallback={<p className="py-16 text-center text-sm text-ash">Зареждане…</p>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
