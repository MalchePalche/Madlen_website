import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Phone, Mail, MapPin, User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { deliveryCost } from "@/lib/orders";
import type { Order } from "@/lib/types";
import { formatEUR } from "@/lib/utils";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";

export const metadata: Metadata = { title: "Поръчка — Админ", robots: { index: false } };

export const dynamic = "force-dynamic";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("bg-BG", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Admin access + Supabase config are enforced by app/admin/layout.tsx.
  const supabase = createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (error || !data) notFound();
  const order = data as Order;

  const a = order.delivery_address;
  const subtotal = order.items.reduce((s, i) => s + i.price_bgn * i.quantity, 0);
  // Delivery wasn't stored separately — recover it from the charged total,
  // falling back to the standard fee rule if totals don't reconcile.
  const recovered = Math.round((order.total_bgn - subtotal) * 100) / 100;
  const delivery = recovered >= 0 ? recovered : deliveryCost(subtotal);

  return (
    <div className="p-5 lg:p-8">
      <Link
        href="/admin/poruchki"
        className="inline-flex min-h-[44px] items-center gap-1 text-[0.72rem] uppercase tracking-widest2 text-ash hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={1.6} /> Назад към поръчките
      </Link>

      <header className="mt-4 flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-6">
        <div>
          <p className="eyebrow">Поръчка</p>
          <h1 className="mt-2 font-display text-3xl tracking-widest2 lg:text-4xl">
            #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="mt-2 text-sm text-ash">{formatDateTime(order.created_at)}</p>
        </div>
        <StatusBadge status={order.status} className="text-[0.7rem] px-3 py-1" />
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* ---- Items + totals ---- */}
        <section className="lg:col-span-2 border border-hairline">
          <h2 className="border-b border-hairline px-6 py-4 text-[0.8rem] uppercase tracking-widest2 font-semibold">
            Артикули ({order.items.length})
          </h2>

          {/* Mobile — stacked item list (no horizontal scroll) */}
          <ul className="divide-y divide-hairline lg:hidden">
            {order.items.map((item) => (
              <li
                key={`${item.productId}-${item.size}-${item.color}`}
                className="flex items-start justify-between gap-3 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="font-medium leading-snug">{item.name_bg}</p>
                  <p className="mt-1 text-[0.78rem] text-ash">
                    {item.color} · {item.size} · {item.quantity} бр.
                  </p>
                </div>
                <span className="shrink-0 tabular-nums">
                  {formatEUR(item.price_bgn * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          {/* Desktop — table */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[34rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-hairline text-left text-[0.66rem] uppercase tracking-widest2 text-ash">
                  <th className="px-6 py-3 font-medium">Продукт</th>
                  <th className="px-3 py-3 font-medium">Цвят</th>
                  <th className="px-3 py-3 font-medium">Размер</th>
                  <th className="px-3 py-3 text-center font-medium">Бр.</th>
                  <th className="px-6 py-3 text-right font-medium">Сума</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr
                    key={`${item.productId}-${item.size}-${item.color}`}
                    className="border-b border-hairline last:border-0"
                  >
                    <td className="px-6 py-3 font-medium">{item.name_bg}</td>
                    <td className="px-3 py-3 text-ash">{item.color}</td>
                    <td className="px-3 py-3 text-ash">{item.size}</td>
                    <td className="px-3 py-3 text-center tabular-nums">{item.quantity}</td>
                    <td className="px-6 py-3 text-right tabular-nums">
                      {formatEUR(item.price_bgn * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="space-y-2 border-t border-hairline px-6 py-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-ash">Междинна сума</dt>
              <dd className="tabular-nums">{formatEUR(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ash">Доставка</dt>
              <dd className="tabular-nums">
                {delivery === 0 ? "Безплатна" : formatEUR(delivery)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-hairline pt-3">
              <dt className="text-[0.8rem] uppercase tracking-widest2 font-semibold">Общо</dt>
              <dd className="font-display text-xl tabular-nums">{formatEUR(order.total_bgn)}</dd>
            </div>
          </dl>
        </section>

        {/* ---- Customer + status ---- */}
        <aside className="space-y-6">
          <section className="border border-hairline p-6">
            <h2 className="text-[0.8rem] uppercase tracking-widest2 font-semibold">Клиент</h2>
            <div className="mt-4 space-y-3 text-sm">
              <p className="flex items-start gap-2.5">
                <User className="mt-0.5 h-4 w-4 shrink-0 text-ash" strokeWidth={1.5} />
                <span>
                  {a.first_name} {a.last_name}
                  {!order.user_id && (
                    <span className="ml-2 align-middle text-[0.62rem] uppercase tracking-widest2 text-ash">
                      (гост)
                    </span>
                  )}
                </span>
              </p>
              <p className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-ash" strokeWidth={1.5} />
                <a
                  href={`tel:${a.phone}`}
                  className="-my-1 inline-block py-1 tabular-nums hover:underline"
                >
                  {a.phone}
                </a>
              </p>
              {a.email && (
                <p className="flex items-start gap-2.5">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-ash" strokeWidth={1.5} />
                  <a
                    href={`mailto:${a.email}`}
                    className="-my-1 inline-block break-all py-1 hover:underline"
                  >
                    {a.email}
                  </a>
                </p>
              )}
              <p className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ash" strokeWidth={1.5} />
                <span className="leading-relaxed">
                  {a.address}
                  <br />
                  {a.postcode} {a.city}
                </span>
              </p>
              {a.note && (
                <p className="border-t border-hairline pt-3 text-ash">„{a.note}“</p>
              )}
            </div>
          </section>

          <section className="border border-hairline p-6">
            <OrderStatusForm orderId={order.id} initialStatus={order.status} />
          </section>
        </aside>
      </div>
    </div>
  );
}
