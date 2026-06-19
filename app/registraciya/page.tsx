import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = { title: "Регистрация", robots: { index: false } };

export default async function RegisterPage() {
  if (isSupabaseConfigured()) {
    const {
      data: { user },
    } = await createClient().auth.getUser();
    if (user) redirect("/akaunt");
  }
  return (
    <AuthShell>
      <RegisterForm />
    </AuthShell>
  );
}
