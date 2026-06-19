import Image from "next/image";
import type { CartItem } from "@/lib/types";
import { formatBGN } from "@/lib/utils";

export function OrderSummary({
  items,
  subtotal,
  delivery,
  total,
}: {
  items: CartItem[];
  subtotal: number;
  delivery: number;
  total: number;
}) {
  return (
    <div className="bg-mist p-6">
      <h2 className="text-[0.8rem] uppercase tracking-widest2 font-semibold">
        Вашата поръчка <span className="text-ash">({items.length})</span>
      </h2>

      <ul className="mt-5 divide-y divide-hairline">
        {items.map((item) => (
          <li key={`${item.productId}-${item.size}-${item.color}`} className="flex gap-3 py-3">
            <div className="relative aspect-[3/4] w-16 shrink-0 overflow-hidden bg-paper">
              <Image src={item.image} alt={item.name_bg} fill sizes="64px" className="object-cover" />
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-noir px-1 text-[0.62rem] font-semibold text-paper">
                {item.quantity}
              </span>
            </div>
            <div className="flex flex-1 flex-col justify-center">
              <p className="text-sm font-medium leading-snug">{item.name_bg}</p>
              <p className="mt-0.5 text-[0.72rem] text-ash">
                {item.color} · Размер {item.size}
              </p>
            </div>
            <span className="self-center text-sm tabular-nums">
              {formatBGN(item.price_bgn * item.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <dl className="mt-5 space-y-2 border-t border-hairline pt-5 text-sm">
        <div className="flex justify-between">
          <dt className="text-ash">Междинна сума</dt>
          <dd className="tabular-nums">{formatBGN(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ash">Доставка</dt>
          <dd className="tabular-nums">{delivery === 0 ? "Безплатна" : formatBGN(delivery)}</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-hairline pt-3">
          <dt className="text-[0.8rem] uppercase tracking-widest2 font-semibold">Общо</dt>
          <dd className="font-display text-xl tabular-nums">{formatBGN(total)}</dd>
        </div>
      </dl>
    </div>
  );
}
