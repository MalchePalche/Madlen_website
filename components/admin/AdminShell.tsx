"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Star,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { useUser } from "@/components/auth/AuthProvider";
import { BRAND } from "@/lib/config";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Табло", icon: LayoutDashboard, exact: true },
  { href: "/admin/prodakti", label: "Продукти", icon: Package, exact: false },
  { href: "/admin/poruchki", label: "Поръчки", icon: ClipboardList, exact: false },
  { href: "/admin/otzivi", label: "Отзиви", icon: Star, exact: false },
] as const;

/** Small attention pill for the moderation queue. Red reads on both the paper
 *  (inactive) and noir (active) nav backgrounds, and caps the count at 99+. */
function NavBadge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      aria-label={`${count} чакащи отзива`}
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#8a2b2b] px-1.5 text-[0.62rem] font-semibold tabular-nums text-paper",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function useActive() {
  const pathname = usePathname();
  return (href: string, exact: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({
  email,
  pendingReviews = 0,
  children,
}: {
  email: string;
  /** Count of reviews awaiting moderation — shown as a badge on the Отзиви nav item. */
  pendingReviews?: number;
  children: React.ReactNode;
}) {
  const isActive = useActive();
  const { signOut } = useUser();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onSignOut = async () => {
    setBusy(true);
    await signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div data-admin className="min-h-dvh bg-paper">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-hairline bg-paper lg:flex">
        <div className="border-b border-hairline px-6 py-6">
          <Link href="/admin" className="font-display text-2xl uppercase tracking-tight">
            {BRAND.name}
          </Link>
          <p className="eyebrow mt-1">Админ панел</p>
        </div>

        <nav className="flex-1 px-3 py-4">
          {NAV.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm transition-colors",
                isActive(href, exact)
                  ? "bg-noir text-paper"
                  : "text-ink hover:bg-mist",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.6} />
              <span>{label}</span>
              {href === "/admin/otzivi" && <NavBadge count={pendingReviews} className="ml-auto" />}
            </Link>
          ))}
        </nav>

        <div className="border-t border-hairline px-3 py-4">
          <p className="truncate px-3 pb-3 text-[0.72rem] text-ash">{email}</p>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 text-sm text-ink transition-colors hover:bg-mist"
          >
            <ExternalLink className="h-4 w-4" strokeWidth={1.6} />
            Виж сайта
          </a>
          <button
            type="button"
            onClick={onSignOut}
            disabled={busy}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-ink transition-colors hover:bg-mist disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.6} />
            {busy ? "Излизане…" : "Изход"}
          </button>
        </div>
      </aside>

      {/* Top bar — mobile. 56px content row + the iPhone safe-area inset on top,
          so the logo/logout clear the notch in standalone PWA mode. The paper
          background fills the inset to cover the status-bar area. List headers
          pin just below it at top-[calc(3.5rem+env(safe-area-inset-top))]. */}
      <header className="sticky top-0 z-40 flex h-[calc(3.5rem+env(safe-area-inset-top))] items-center justify-between border-b border-hairline bg-paper px-5 pt-[env(safe-area-inset-top)] lg:hidden">
        <Link href="/admin" className="font-display text-xl uppercase">
          {BRAND.name} <span className="eyebrow align-middle">Админ</span>
        </Link>
        <button
          type="button"
          onClick={onSignOut}
          disabled={busy}
          aria-label="Изход"
          className="-mr-2 inline-flex h-11 w-11 items-center justify-center text-ash transition-colors hover:text-ink disabled:opacity-60"
        >
          <LogOut className="h-5 w-5" strokeWidth={1.6} />
        </button>
      </header>

      {/* Content — each page owns its own padding (matches the orders pages).
          Mobile keeps room for the fixed bottom nav + the home-indicator inset. */}
      <main className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0 lg:pl-60">
        {children}
      </main>

      {/* Bottom navigation — mobile, native-app style */}
      <nav
        aria-label="Основна навигация"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-hairline bg-paper/95 backdrop-blur lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-h-[56px] flex-col items-center justify-center gap-1 text-[0.6rem] uppercase tracking-widest2 transition-colors",
                active ? "text-ink" : "text-ash",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute inset-x-6 top-0 h-0.5 transition-colors",
                  active ? "bg-noir" : "bg-transparent",
                )}
              />
              <span className="relative">
                <Icon className="h-[1.35rem] w-[1.35rem]" strokeWidth={active ? 2 : 1.6} />
                {href === "/admin/otzivi" && (
                  <NavBadge
                    count={pendingReviews}
                    className="absolute -right-3 -top-1.5 h-4 min-w-4 px-1 text-[0.55rem]"
                  />
                )}
              </span>
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
