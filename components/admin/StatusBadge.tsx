import type { OrderStatus } from "@/lib/types";
import { ORDER_STATUS_LABELS } from "@/lib/orders";
import { cn } from "@/lib/utils";

/**
 * Subtle, low-saturation status pill so admins can scan order states at a
 * glance without breaking the monochrome editorial palette.
 */
const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "border-amber-300 bg-amber-50 text-amber-800",
  confirmed: "border-sky-300 bg-sky-50 text-sky-800",
  shipped: "border-violet-300 bg-violet-50 text-violet-800",
  delivered: "border-emerald-300 bg-emerald-50 text-emerald-800",
  cancelled: "border-hairline bg-mist text-ash line-through",
};

export function StatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap border px-2 py-0.5 text-[0.62rem] uppercase tracking-widest2 font-medium",
        STATUS_STYLES[status],
        className,
      )}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
