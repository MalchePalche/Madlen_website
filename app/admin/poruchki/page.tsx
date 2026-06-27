import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Order } from "@/lib/types";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { PullToRefresh, RefreshButton } from "@/components/admin/PullToRefresh";

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
    <PullToRefresh>
      <div className="lg:p-8">
        <header className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-30 flex items-end justify-between gap-3 border-b border-hairline bg-paper px-5 py-4 lg:static lg:px-0 lg:py-0 lg:pb-6">
          <div>
            <p className="eyebrow">
              {orders.length} {orders.length === 1 ? "поръчка" : "поръчки"}
            </p>
            <h1 className="mt-1 font-display text-2xl lg:mt-2 lg:text-5xl">Поръчки</h1>
          </div>
          <RefreshButton />
        </header>

        <div className="px-5 pb-6 pt-6 lg:px-0 lg:pb-0 lg:pt-8">
          <OrdersTable orders={orders} />
        </div>
      </div>
    </PullToRefresh>
  );
}
