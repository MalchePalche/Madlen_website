import Link from "next/link";
import { ShoppingBag, Banknote, Clock, Package, ArrowRight, type LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatEUR } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";
import { PullToRefresh, RefreshButton } from "@/components/admin/PullToRefresh";

export const dynamic = "force-dynamic";

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex min-h-[7rem] flex-col justify-between border border-hairline bg-paper p-5 lg:min-h-0 lg:p-6">
      <div className="flex items-center justify-between gap-2">
        <p className="eyebrow">{label}</p>
        <Icon className="h-4 w-4 shrink-0 text-ash" strokeWidth={1.6} />
      </div>
      <p className="mt-5 break-words font-display text-2xl leading-none tabular-nums sm:text-3xl lg:mt-4 lg:text-4xl">
        {value}
      </p>
    </div>
  );
}

export default async function AdminDashboard() {
  const supabase = createClient();

  const [{ data: orders }, { count: productCount }] = await Promise.all([
    supabase.from("orders").select("total_bgn, status"),
    supabase.from("products").select("*", { count: "exact", head: true }),
  ]);

  const rows = (orders ?? []) as { total_bgn: number; status: OrderStatus }[];
  const totalOrders = rows.length;
  const pendingOrders = rows.filter((o) => o.status === "pending").length;
  // Revenue counts every order that wasn't cancelled.
  const revenue = rows
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + Number(o.total_bgn), 0);

  return (
    <PullToRefresh>
      <div className="p-6 lg:p-8">
        <header className="flex items-end justify-between gap-3 border-b border-hairline pb-6">
          <div>
            <p className="eyebrow">Преглед</p>
            <h1 className="mt-2 font-display text-3xl lg:text-4xl">Табло</h1>
          </div>
          {/* lg:inline-flex overrides the button's default lg:hidden — the
              dashboard stats deserve a manual refresh on desktop too. */}
          <RefreshButton className="lg:inline-flex" />
        </header>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard label="Поръчки" value={String(totalOrders)} icon={ShoppingBag} />
          <StatCard label="Приходи" value={formatEUR(revenue)} icon={Banknote} />
          <StatCard label="В обработка" value={String(pendingOrders)} icon={Clock} />
          <StatCard label="Продукти" value={String(productCount ?? 0)} icon={Package} />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link
            href="/admin/prodakti"
            className="group flex items-center justify-between border border-hairline bg-paper p-6 transition-colors hover:bg-mist"
          >
            <div>
              <p className="text-sm font-semibold">Управление на продукти</p>
              <p className="mt-1 text-[0.8rem] text-ash">Добавяне, редакция и изтриване</p>
            </div>
            <ArrowRight
              className="h-5 w-5 text-ash transition-transform group-hover:translate-x-1"
              strokeWidth={1.6}
            />
          </Link>
          <Link
            href="/admin/poruchki"
            className="group flex items-center justify-between border border-hairline bg-paper p-6 transition-colors hover:bg-mist"
          >
            <div>
              <p className="text-sm font-semibold">Поръчки</p>
              <p className="mt-1 text-[0.8rem] text-ash">Преглед на всички поръчки</p>
            </div>
            <ArrowRight
              className="h-5 w-5 text-ash transition-transform group-hover:translate-x-1"
              strokeWidth={1.6}
            />
          </Link>
        </div>
      </div>
    </PullToRefresh>
  );
}
