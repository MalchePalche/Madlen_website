"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ORDER_STATUS_LABELS, ORDER_STATUSES } from "@/lib/orders";
import type { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function OrderStatusForm({
  orderId,
  initialStatus,
}: {
  orderId: string;
  initialStatus: OrderStatus;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState<OrderStatus>(initialStatus);
  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  const [busy, setBusy] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changed = status !== saved;

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changed || busy) return;
    setBusy(true);
    setError(null);
    setJustSaved(false);

    const supabase = createClient();
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);

    setBusy(false);
    if (error) {
      setError("Грешка при запазване. Опитайте отново.");
      return;
    }

    setSaved(status);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2200);
    // Re-fetch the server component so the rest of the page reflects the change.
    router.refresh();
  };

  return (
    <form onSubmit={onSave} className="space-y-4">
      <div>
        <label
          htmlFor="order-status"
          className="block text-[0.68rem] uppercase tracking-widest2 text-ash mb-1.5"
        >
          Статус на поръчката
        </label>
        <select
          id="order-status"
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus)}
          disabled={busy}
          className="w-full border border-hairline bg-paper px-3.5 py-3 text-sm focus:outline-none focus-visible:outline-2 focus-visible:outline-noir"
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p role="alert" className="flex items-center gap-2 text-sm text-[#8a2b2b]">
          <AlertCircle className="h-4 w-4" strokeWidth={1.6} /> {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || !changed}
        className={cn("btn-noir w-full", (busy || !changed) && "opacity-60")}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : justSaved ? (
          <>
            <Check className="h-4 w-4" strokeWidth={2} /> Запазено
          </>
        ) : (
          "Запази"
        )}
      </button>
    </form>
  );
}
