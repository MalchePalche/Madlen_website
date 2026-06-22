"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { useCart, cartLineKey, selectSubtotal, selectCount } from "@/store/cart";
import { BRAND } from "@/lib/config";
import { formatEUR } from "@/lib/utils";

export function CartDrawer() {
  const isOpen = useCart((s) => s.isOpen);
  const closeCart = useCart((s) => s.closeCart);
  const items = useCart((s) => s.items);
  const setQuantity = useCart((s) => s.setQuantity);
  const removeItem = useCart((s) => s.removeItem);
  const subtotal = useCart(selectSubtotal);
  const count = useCart(selectCount);

  // Close on Escape + lock background scroll while open.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeCart();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, closeCart]);

  const remaining = Math.max(0, BRAND.freeShippingThreshold - subtotal);
  const progress = Math.min(100, (subtotal / BRAND.freeShippingThreshold) * 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={closeCart}
            aria-hidden
          />

          <motion.aside
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[440px] flex-col bg-paper"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", ease: [0.22, 1, 0.36, 1], duration: 0.4 }}
            role="dialog"
            aria-modal="true"
            aria-label="Кошница"
          >
            {/* header */}
            <div className="flex items-center justify-between border-b border-hairline px-6 py-5">
              <h2 className="text-[0.8rem] uppercase tracking-widest2 font-semibold">
                Кошница {count > 0 && <span className="text-ash">({count})</span>}
              </h2>
              <button type="button" aria-label="Затвори" onClick={closeCart} className="-mr-1 p-1.5 hover:opacity-60">
                <X className="h-5 w-5" strokeWidth={1.4} />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
                <ShoppingBag className="h-10 w-10 text-ash" strokeWidth={1} />
                <div>
                  <p className="font-display text-2xl">Кошницата е празна</p>
                  <p className="mt-2 text-sm text-ash">Добавете продукти, за да продължите.</p>
                </div>
                <button type="button" onClick={closeCart} className="btn-noir">
                  Разгледай колекцията
                </button>
              </div>
            ) : (
              <>
                {/* free-shipping progress */}
                <div className="border-b border-hairline px-6 py-4">
                  <p className="text-[0.74rem] text-ash">
                    {remaining > 0 ? (
                      <>
                        Още <span className="font-semibold text-ink">{formatEUR(remaining)}</span> до безплатна доставка
                      </>
                    ) : (
                      <span className="font-semibold text-ink">Имате безплатна доставка 🎉</span>
                    )}
                  </p>
                  <div className="mt-2 h-px w-full bg-hairline">
                    <div
                      className="h-px bg-ink transition-all duration-500 ease-editorial"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* line items */}
                <ul className="flex-1 divide-y divide-hairline overflow-y-auto px-6">
                  {items.map((item) => {
                    const key = cartLineKey(item);
                    return (
                      <li key={key} className="flex gap-4 py-5">
                        <div className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden bg-mist">
                          <Image
                            src={item.image}
                            alt={item.name_bg}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              href={`/produkt/${item.slug}`}
                              onClick={closeCart}
                              className="text-sm font-medium leading-snug hover:opacity-70"
                            >
                              {item.name_bg}
                            </Link>
                            <button
                              type="button"
                              aria-label="Премахни"
                              onClick={() => removeItem(key)}
                              className="p-1 text-ash hover:text-ink"
                            >
                              <Trash2 className="h-4 w-4" strokeWidth={1.4} />
                            </button>
                          </div>
                          <p className="mt-0.5 text-[0.74rem] text-ash">
                            {item.color} · Размер {item.size}
                          </p>
                          <div className="mt-auto flex items-center justify-between pt-3">
                            <div className="flex items-center border border-hairline">
                              <button
                                type="button"
                                aria-label="Намали"
                                onClick={() => setQuantity(key, item.quantity - 1)}
                                className="flex h-8 w-8 items-center justify-center hover:bg-mist"
                              >
                                <Minus className="h-3.5 w-3.5" strokeWidth={1.5} />
                              </button>
                              <span className="w-8 text-center text-sm tabular-nums">{item.quantity}</span>
                              <button
                                type="button"
                                aria-label="Увеличи"
                                onClick={() => setQuantity(key, item.quantity + 1)}
                                className="flex h-8 w-8 items-center justify-center hover:bg-mist"
                              >
                                <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
                              </button>
                            </div>
                            <span className="text-sm font-medium tabular-nums">
                              {formatEUR(item.price_bgn * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {/* footer */}
                <div className="border-t border-hairline px-6 py-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-ash">Междинна сума</span>
                    <span className="font-display text-xl tabular-nums">{formatEUR(subtotal)}</span>
                  </div>
                  <p className="mt-1 text-[0.72rem] text-ash">
                    Доставката се изчислява на следваща стъпка · Плащане при доставка.
                  </p>
                  <Link href="/porachka" onClick={closeCart} className="btn-noir mt-4 w-full">
                    Продължи към поръчката
                  </Link>
                  <button
                    type="button"
                    onClick={closeCart}
                    className="mt-3 w-full text-center text-[0.74rem] uppercase tracking-widest2 text-ash hover:text-ink"
                  >
                    Продължи пазаруването
                  </button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
