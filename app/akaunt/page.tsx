import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { DeliveryAddress, Order, Profile } from "@/lib/types";
import { PersonalDetails } from "@/components/account/PersonalDetails";
import { DefaultAddress } from "@/components/account/DefaultAddress";
import { OrderHistory } from "@/components/account/OrderHistory";
import { SignOutButton } from "@/components/account/SignOutButton";

export const metadata: Metadata = { title: "Моят профил", robots: { index: false } };

export default async function AccountPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="gutter mx-auto max-w-md py-24 text-center">
        <h1 className="font-display text-3xl">Профил</h1>
        <p className="mt-4 text-sm text-ash">
          Профилът изисква свързан Supabase проект. Вижте README за настройка.
        </p>
        <Link href="/" className="btn-noir mt-8">
          Към началото
        </Link>
      </div>
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/vlez?redirect=/akaunt");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  const profile = profileData as Profile | null;

  const { data: ordersData } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const orders = (ordersData ?? []) as Order[];

  const firstName = profile?.full_name?.split(" ")[0] || user.email?.split("@")[0] || "";

  return (
    <div className="gutter mx-auto max-w-edge pb-24 pt-8 lg:pt-12">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-hairline pb-6">
        <div>
          <p className="eyebrow">Моят профил</p>
          <h1 className="mt-3 font-display text-4xl lg:text-5xl">Здравейте, {firstName}</h1>
        </div>
        <SignOutButton />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <PersonalDetails
          userId={user.id}
          email={user.email ?? ""}
          initialName={profile?.full_name ?? ""}
          initialPhone={profile?.phone ?? ""}
        />
        <DefaultAddress userId={user.id} initial={(profile?.default_address as DeliveryAddress) ?? null} />
      </div>

      <div className="mt-6">
        <OrderHistory orders={orders} />
      </div>
    </div>
  );
}
