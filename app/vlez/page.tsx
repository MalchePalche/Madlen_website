import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Вход", robots: { index: false } };

export default async function LoginPage() {
  if (isSupabaseConfigured()) {
    const {
      data: { user },
    } = await createClient().auth.getUser();
    if (user) redirect("/akaunt");
  }
  return (
    <AuthShell>
      <Suspense fallback={<p className="py-16 text-center text-sm text-ash">Зареждане…</p>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
