import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Order } from "@/lib/types";
import { OrdersTable } from "@/components/admin/OrdersTable";

export const metadata: Metadata = { title: "Поръчки — Админ", robots: { index: false } };

// Always fetch the latest orders — never serve a cached snapshot.
export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  // Admin access + Supabase config are enforced by app/admin/layout.tsx.
  const supabase = createClient();
  const { data } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  const orders = (data ?? []) as Order[];

  return (
    <div>
      <header className="border-b border-hairline pb-6">
        <p className="eyebrow">
          {orders.length} {orders.length === 1 ? "поръчка" : "поръчки"}
        </p>
        <h1 className="mt-2 font-display text-4xl lg:text-5xl">Поръчки</h1>
      </header>

      <div className="mt-8">
        <OrdersTable orders={orders} />
      </div>
    </div>
  );
}
