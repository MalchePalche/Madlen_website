"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { categoryLabel, genderLabel } from "@/lib/config";
import { formatEUR } from "@/lib/utils";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProductTable({ products }: { products: Product[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<Product | null>(null); // product awaiting delete confirmation
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (!pending) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from("products").delete().eq("id", pending.id);
    setBusy(false);
    if (error) {
      setError("Грешка при изтриване. Опитайте отново.");
      return;
    }
    setPending(null);
    router.refresh();
  };

  if (products.length === 0) {
    return (
      <div className="border border-hairline bg-paper p-12 text-center">
        <p className="text-sm text-ash">Все още няма продукти.</p>
        <Link href="/admin/prodakti/nov" className="btn-noir mt-6">
          Добави първия продукт
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto border border-hairline bg-paper">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-hairline text-[0.68rem] uppercase tracking-widest2 text-ash">
              <th className="px-4 py-3 font-medium">Продукт</th>
              <th className="px-4 py-3 font-medium">Цена</th>
              <th className="px-4 py-3 font-medium">Пол</th>
              <th className="px-4 py-3 font-medium">Категория</th>
              <th className="px-4 py-3 font-medium">Ново</th>
              <th className="px-4 py-3 font-medium">Наличност</th>
              <th className="px-4 py-3 text-right font-medium">Действия</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-hairline last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-10 shrink-0 overflow-hidden bg-mist">
                      {p.images[0] && (
                        <Image
                          src={p.images[0]}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <span className="font-medium">{p.name_bg}</span>
                  </div>
                </td>
                <td className="px-4 py-3 tabular-nums">{formatEUR(p.price_bgn)}</td>
                <td className="px-4 py-3">{genderLabel(p.gender)}</td>
                <td className="px-4 py-3">{categoryLabel(p.category)}</td>
                <td className="px-4 py-3">
                  {p.is_new ? (
                    <span className="bg-noir px-2 py-0.5 text-[0.6rem] uppercase tracking-widest2 text-paper">
                      Ново
                    </span>
                  ) : (
                    <span className="text-ash">—</span>
                  )}
                </td>
                <td
                  className={cn(
                    "px-4 py-3 tabular-nums",
                    p.stock === 0 && "text-[#8a2b2b]",
                  )}
                >
                  {p.stock}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/admin/prodakti/${p.slug}/edit`}
                      aria-label={`Редактирай ${p.name_bg}`}
                      className="inline-flex h-8 w-8 items-center justify-center text-ash transition-colors hover:bg-mist hover:text-ink"
                    >
                      <Pencil className="h-4 w-4" strokeWidth={1.6} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setPending(p);
                      }}
                      aria-label={`Изтрий ${p.name_bg}`}
                      className="inline-flex h-8 w-8 items-center justify-center text-ash transition-colors hover:bg-mist hover:text-[#8a2b2b]"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.6} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation dialog */}
      {pending && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-noir/40 p-5"
          role="dialog"
          aria-modal="true"
          onClick={() => !busy && setPending(null)}
        >
          <div
            className="w-full max-w-sm border border-hairline bg-paper p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-2xl">Изтриване на продукт</h2>
            <p className="mt-3 text-sm text-ash">
              Сигурни ли сте, че искате да изтриете{" "}
              <span className="font-medium text-ink">{pending.name_bg}</span>? Това действие е
              необратимо.
            </p>

            {error && (
              <p role="alert" className="mt-4 flex items-center gap-2 text-sm text-[#8a2b2b]">
                <AlertCircle className="h-4 w-4" strokeWidth={1.6} /> {error}
              </p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setPending(null)}
                disabled={busy}
                className="btn-outline flex-1 disabled:opacity-60"
              >
                Отказ
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={busy}
                className="inline-flex flex-1 items-center justify-center gap-2 bg-[#8a2b2b] px-8 py-4 text-[0.72rem] font-semibold uppercase tracking-widest2 text-paper transition-colors hover:bg-[#741f1f] disabled:opacity-70"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Изтрий"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
