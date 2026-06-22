import Link from "next/link";
import { ShoppingBag, Banknote, Clock, Package, ArrowRight, type LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatEUR } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";

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
    <div className="border border-hairline bg-paper p-6">
      <div className="flex items-center justify-between">
        <p className="eyebrow">{label}</p>
        <Icon className="h-4 w-4 text-ash" strokeWidth={1.6} />
      </div>
      <p className="mt-4 font-display text-4xl tabular-nums">{value}</p>
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
    <div className="p-6 lg:p-8">
      <header className="border-b border-hairline pb-6">
        <p className="eyebrow">Преглед</p>
        <h1 className="mt-2 font-display text-3xl lg:text-4xl">Табло</h1>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
  );
}
