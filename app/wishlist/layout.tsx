import type { Metadata } from "next";

// The wishlist page itself is a client component (localStorage-driven), so its
// metadata lives here in a server-side layout.
export const metadata: Metadata = {
  title: { absolute: "Любими продукти | Noem Studio" },
  description: "Вашите запазени продукти от Noem Studio.",
};

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return children;
}
