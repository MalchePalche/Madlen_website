"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { CartDrawer } from "@/components/cart/CartDrawer";

/**
 * Wraps page content with the storefront chrome (announcement bar, navbar,
 * footer, cart drawer) — except under /admin, which has its own shell.
 */
export function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  if (isAdmin) return <>{children}</>;

  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <main id="content">{children}</main>
      <Footer />
      <CartDrawer />
    </>
  );
}
