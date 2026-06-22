import Link from "next/link";
import type { Order } from "@/lib/types";
import { ORDER_STATUS_LABELS } from "@/lib/orders";
import { formatEUR } from "@/lib/utils";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("bg-BG", { day: "2-digit", month: "long", year: "numeric" });
}

export function OrderHistory({ orders }: { orders: Order[] }) {
  return (
    <section className="border border-hairline p-6">
      <h2 className="text-[0.8rem] uppercase tracking-widest2 font-semibold">История на поръчките</h2>

      {orders.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-ash">Все още нямате поръчки.</p>
          <Link href="/novo" className="btn-outline mt-5">
            Разгледай продуктите
          </Link>
        </div>
      ) : (
        <ul className="mt-5 divide-y divide-hairline">
          {orders.map((o) => {
            const count = o.items.reduce((n, i) => n + i.quantity, 0);
            return (
              <li key={o.id} className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="text-sm font-medium tracking-widest2">#{o.id.slice(0, 8).toUpperCase()}</p>
                  <p className="mt-1 text-[0.78rem] text-ash">
                    {formatDate(o.created_at)} · {count} {count === 1 ? "артикул" : "артикула"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm tabular-nums">{formatEUR(o.total_bgn)}</p>
                  <span className="mt-1 inline-block border border-hairline bg-mist px-2 py-0.5 text-[0.62rem] uppercase tracking-widest2 text-ash">
                    {ORDER_STATUS_LABELS[o.status]}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
