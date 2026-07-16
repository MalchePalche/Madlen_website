import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** The checkout journey: cart (drawer) → delivery details → payment/confirm. */
const STEPS = ["Кошница", "Данни", "Плащане"] as const;

interface CheckoutStepsProps {
  /** 1-based step that is currently active; earlier steps render as complete. */
  current: 1 | 2 | 3;
  /** Marks every step complete (order-success page). */
  done?: boolean;
  className?: string;
}

/**
 * Visual progress stepper for the checkout flow. Purely informative (steps are
 * not links — the cart lives in a drawer, and details/payment share /porachka).
 */
export function CheckoutSteps({ current, done = false, className }: CheckoutStepsProps) {
  return (
    <ol aria-label="Стъпки на поръчката" className={cn("flex items-center", className)}>
      {STEPS.map((label, i) => {
        const n = i + 1;
        const complete = done || n < current;
        const active = !done && n === current;
        // The one label a narrow phone still shows (see below): the active
        // step, or the final step once everything is done.
        const keyLabel = active || (done && n === STEPS.length);
        return (
          <li key={label} aria-current={active ? "step" : undefined} className="flex items-center">
            {i > 0 && (
              <span
                aria-hidden
                className={cn(
                  "mx-3 h-px w-6 sm:mx-4 sm:w-10",
                  complete ? "bg-ink" : "bg-hairline",
                )}
              />
            )}
            <span className="flex items-center gap-2">
              <span
                aria-hidden
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[0.68rem] tabular-nums",
                  complete
                    ? "border-ink bg-ink text-paper"
                    : active
                      ? "border-ink text-ink"
                      : "border-hairline text-ash",
                )}
              >
                {complete ? <Check className="h-3 w-3" strokeWidth={2} /> : n}
              </span>
              <span
                className={cn(
                  "text-[0.68rem] uppercase tracking-widest2",
                  active || complete ? "text-ink" : "text-ash",
                  active && "font-semibold",
                  // Three uppercase labels don't fit a narrow phone — keep
                  // only the key one there; circles still show progress.
                  !keyLabel && "hidden sm:inline",
                )}
              >
                {label}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
