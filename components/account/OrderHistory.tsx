import Image from "next/image";
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
            const preview = o.items.slice(0, 3);
            const firstName = o.items[0]?.name_bg ?? "Поръчка";
            const extra = o.items.length - 1;
            return (
              <li key={o.id} className="py-4">
                <div className="flex items-center gap-4">
                  {/* product image thumbnails */}
                  <div className="flex shrink-0 gap-1.5">
                    {preview.map((item, idx) => (
                      <div
                        key={`${item.productId}-${item.size}-${item.color}-${idx}`}
                        className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-mist"
                      >
                        {item.image && (
                          <Image
                            src={item.image}
                            alt={item.name_bg}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* product names + meta */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium leading-snug">
                      {firstName}
                      {extra > 0 && <span className="text-ash"> и още {extra}</span>}
                    </p>
                    <p className="mt-1 text-[0.78rem] text-ash">
                      {formatDate(o.created_at)} · {count} {count === 1 ? "артикул" : "артикула"}
                    </p>
                  </div>

                  {/* price + status */}
                  <div className="shrink-0 text-right">
                    <p className="text-sm tabular-nums">{formatEUR(o.total_bgn)}</p>
                    <span className="mt-1 inline-block border border-hairline bg-mist px-2 py-0.5 text-[0.62rem] uppercase tracking-widest2 text-ash">
                      {ORDER_STATUS_LABELS[o.status]}
                    </span>
                  </div>
                </div>

                {/* faint reference number */}
                <p className="mt-2 text-[0.62rem] tracking-widest2 text-ash/70">
                  Реф. #{o.id.slice(0, 8).toUpperCase()}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
