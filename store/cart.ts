"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem } from "@/lib/types";

/** Stable identity for a cart line: same product + size + colour. */
function lineKey(i: Pick<CartItem, "productId" | "size" | "color">) {
  return `${i.productId}__${i.size}__${i.color}`;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  _hasHydrated: boolean;

  addItem: (item: CartItem) => void;
  removeItem: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clear: () => void;

  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      _hasHydrated: false,

      addItem: (item) => {
        const items = [...get().items];
        const key = lineKey(item);
        const existing = items.find((i) => lineKey(i) === key);
        if (existing) {
          existing.quantity = Math.min(existing.quantity + item.quantity, 99);
        } else {
          items.push({ ...item, quantity: Math.min(item.quantity, 99) });
        }
        set({ items, isOpen: true });
      },

      removeItem: (key) =>
        set((s) => ({ items: s.items.filter((i) => lineKey(i) !== key) })),

      setQuantity: (key, quantity) =>
        set((s) => ({
          items: s.items
            .map((i) =>
              lineKey(i) === key ? { ...i, quantity: Math.max(0, Math.min(quantity, 99)) } : i,
            )
            .filter((i) => i.quantity > 0),
        })),

      clear: () => set({ items: [] }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
    }),
    {
      name: "noem-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items }),
      onRehydrateStorage: () => (state) => {
        if (state) state._hasHydrated = true;
      },
    },
  ),
);

/** Re-export for components that need the line key (e.g. drawer rows). */
export const cartLineKey = lineKey;

/** Total number of units in the cart. */
export const selectCount = (s: CartState) =>
  s.items.reduce((n, i) => n + i.quantity, 0);

/** Subtotal in EUR. */
export const selectSubtotal = (s: CartState) =>
  s.items.reduce((sum, i) => sum + i.price_bgn * i.quantity, 0);
