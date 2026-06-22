import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = { title: "Админ", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <h1 className="font-display text-3xl">Админ панел</h1>
        <p className="mt-4 text-sm text-ash">
          Админ панелът изисква свързан Supabase проект. Вижте README за настройка.
        </p>
        <Link href="/" className="btn-noir mt-8">
          Към началото
        </Link>
      </div>
    );
  }

  // Defence in depth — middleware already gates /admin, but guard here too in
  // case a request reaches the layout without passing through it.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_admin) redirect("/");

  return <AdminShell email={user.email ?? ""}>{children}</AdminShell>;
}
