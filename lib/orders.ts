import { isSupabaseConfiguredClient } from "./supabase/client";
import { BRAND } from "./config";
import type { CartItem, DeliveryAddress, OrderStatus } from "./types";

/** Flat delivery fee in EUR, waived above the free-shipping threshold. */
export const DELIVERY_FEE = 5.99;

export function deliveryCost(subtotal: number): number {
  return subtotal >= BRAND.freeShippingThreshold ? 0 : DELIVERY_FEE;
}

/** Bulgarian labels for the order status enum (used in order history). */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "В обработка",
  confirmed: "Потвърдена",
  shipped: "Изпратена",
  delivered: "Доставена",
  cancelled: "Отказана",
};

/** All statuses in fulfilment order — drives the admin status filter/sort/dropdown. */
export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

/** Rank a status for sorting (follows the fulfilment lifecycle). */
export function orderStatusRank(status: OrderStatus): number {
  const i = ORDER_STATUSES.indexOf(status);
  return i === -1 ? ORDER_STATUSES.length : i;
}

/** RFC4122 id, with a fallback for non-secure contexts. */
export function newOrderId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export interface NewOrder {
  id: string;
  items: CartItem[];
  total_bgn: number;
  delivery_address: DeliveryAddress;
}

/**
 * Persist an order via the server route (app/api/create-order), which inserts
 * with the service-role key behind IP rate limiting + validation — so the write
 * can't be spammed the way a direct client-side insert could. The id is still
 * generated client-side so we don't rely on a RETURNING select. The signed-in
 * user is resolved server-side from the session cookie (guests stay null). In
 * mock mode (no Supabase env) this is a no-op.
 */
export async function createOrder(order: NewOrder): Promise<void> {
  if (!isSupabaseConfiguredClient()) return;

  const res = await fetch("/api/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order),
  });

  if (!res.ok) {
    let message = "order_failed";
    try {
      const data = (await res.json()) as { error?: string };
      if (data?.error) message = data.error;
    } catch {
      /* non-JSON error body — keep the generic message */
    }
    throw new Error(message);
  }
}

// ---- confirmation hand-off (survives the redirect within the tab) ---------

const STORE_KEY = "noem-last-order";

export interface StoredOrder {
  id: string;
  items: CartItem[];
  subtotal: number;
  delivery: number;
  total_bgn: number;
  delivery_address: DeliveryAddress;
  created_at: string;
}

export function saveLastOrder(order: StoredOrder) {
  try {
    sessionStorage.setItem(STORE_KEY, JSON.stringify(order));
  } catch {
    /* storage unavailable — confirmation page falls back to id-only view */
  }
}

export function loadLastOrder(id: string): StoredOrder | null {
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredOrder;
    return parsed.id === id ? parsed : null;
  } catch {
    return null;
  }
}
