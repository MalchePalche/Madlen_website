"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { useUser } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Табло", icon: LayoutDashboard, exact: true },
  { href: "/admin/prodakti", label: "Продукти", icon: Package, exact: false },
  { href: "/admin/poruchki", label: "Поръчки", icon: ClipboardList, exact: false },
] as const;

function useActive() {
  const pathname = usePathname();
  return (href: string, exact: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({
  email,
  children,
}: {
  email: string;
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
    <div className="min-h-screen bg-paper">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-hairline bg-paper lg:flex">
        <div className="border-b border-hairline px-6 py-6">
          <Link href="/admin" className="font-display text-2xl tracking-tight">
            MADLEN
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
              <Icon className="h-4 w-4" strokeWidth={1.6} />
              {label}
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

      {/* Top bar — mobile */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-hairline bg-paper px-5 py-4 lg:hidden">
        <Link href="/admin" className="font-display text-xl">
          MADLEN <span className="eyebrow align-middle">Админ</span>
        </Link>
        <button
          type="button"
          onClick={onSignOut}
          disabled={busy}
          aria-label="Изход"
          className="text-ash transition-colors hover:text-ink disabled:opacity-60"
        >
          <LogOut className="h-5 w-5" strokeWidth={1.6} />
        </button>
      </header>
      <nav className="flex gap-1 overflow-x-auto border-b border-hairline bg-paper px-3 py-2 lg:hidden">
        {NAV.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-2 whitespace-nowrap px-3 py-2 text-[0.78rem] transition-colors",
              isActive(href, exact) ? "bg-noir text-paper" : "text-ink hover:bg-mist",
            )}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.6} />
            {label}
          </Link>
        ))}
      </nav>

      {/* Content — each page owns its own padding (matches the orders pages). */}
      <main className="lg:pl-60">{children}</main>
    </div>
  );
}
