"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, User, ShoppingBag, Menu, X, ChevronDown } from "lucide-react";
import { BRAND, NAV_LINKS } from "@/lib/config";

/** Category submenu shown under the "Дамско" nav item (desktop dropdown + mobile accordion). */
const DAMSKO_CATEGORIES = [
  { label: "Всички продукти", href: "/damsko" },
  { label: "Рокли", href: "/damsko?cat=rokli" },
  { label: "Сетове", href: "/damsko?cat=setove" },
  { label: "Тениски и топове", href: "/damsko?cat=topove" },
  { label: "Ризи", href: "/damsko?cat=topove" },
  { label: "Панталони", href: "/damsko?cat=pantaloni" },
] as const;
import { useCart, selectCount } from "@/store/cart";
import { useUser } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/utils";

export function Navbar() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [damskoOpen, setDamskoOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const openCart = useCart((s) => s.openCart);
  const count = useCart(selectCount);
  const hydrated = useCart((s) => s._hasHydrated);
  const { user } = useUser();
  const accountHref = user ? "/akaunt" : "/vlez";

  // Tooltip label: first name (from full_name metadata) → email → fallback; "Гост" when signed out.
  const profileLabel = (() => {
    if (!user) return "Гост";
    const fullName = (user.user_metadata?.full_name as string | undefined)?.trim();
    if (fullName) return fullName.split(/\s+/)[0];
    return user.email ?? "Профил";
  })();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Focus the search field on open; close on Escape.
  useEffect(() => {
    if (!searchOpen) return;
    searchInputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSearchOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [searchOpen]);

  const openSearch = () => {
    setMenuOpen(false);
    setSearchOpen(true);
  };

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = term.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
    setMenuOpen(false);
    setTerm("");
  };

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 bg-paper/85 backdrop-blur-md transition-shadow duration-300",
          scrolled || searchOpen ? "border-b border-hairline" : "border-b border-transparent",
        )}
      >
        <nav className="gutter relative grid h-16 grid-cols-[1fr_auto_1fr] items-center lg:h-[72px]">
          {/* left — desktop nav / mobile hamburger */}
          <div className="flex items-center gap-7">
            <button
              type="button"
              className="-ml-1 p-1.5 lg:hidden"
              aria-label="Меню"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="h-5 w-5" strokeWidth={1.4} />
            </button>
            <ul className="hidden items-center gap-7 lg:flex">
              {NAV_LINKS.map((l) =>
                l.href === "/damsko" ? (
                  <li key={l.href} className="group/sub relative">
                    <Link
                      href={l.href}
                      className="group relative flex items-center gap-1 text-[0.78rem] uppercase tracking-widest2 font-medium"
                    >
                      {l.label}
                      <ChevronDown
                        className="h-3 w-3 transition-transform duration-300 group-hover/sub:rotate-180"
                        strokeWidth={1.6}
                      />
                      <span className="absolute -bottom-1 left-0 h-px w-0 bg-ink transition-all duration-300 ease-editorial group-hover:w-full" />
                    </Link>
                    {/* dropdown — pt-3 bridges the gap so hover isn't lost between trigger and menu */}
                    <div className="invisible absolute left-0 top-full z-50 pt-3 opacity-0 transition-opacity duration-200 group-hover/sub:visible group-hover/sub:opacity-100">
                      <ul className="min-w-[220px] border border-hairline bg-white py-2 shadow-lg">
                        {DAMSKO_CATEGORIES.map((c) => (
                          <li key={c.label}>
                            <Link
                              href={c.href}
                              className="block px-5 py-2.5 text-[0.72rem] uppercase tracking-widest2 font-medium text-ink transition-colors hover:bg-paper"
                            >
                              {c.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                ) : (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="group relative text-[0.78rem] uppercase tracking-widest2 font-medium"
                    >
                      {l.label}
                      <span className="absolute -bottom-1 left-0 h-px w-0 bg-ink transition-all duration-300 ease-editorial group-hover:w-full" />
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>

          {/* center — wordmark */}
          <Link
            href="/"
            aria-label={`${BRAND.name} — начало`}
            className="justify-self-center"
          >
            <Image
              src="/logo.png"
              alt={BRAND.name}
              width={64}
              height={64}
              priority
              className="h-12 w-auto sm:h-14"
            />
          </Link>

          {/* right — icons */}
          <div className="flex items-center justify-end gap-1 sm:gap-2.5">
            <button
              type="button"
              aria-label="Търсене"
              aria-expanded={searchOpen}
              onClick={openSearch}
              className="hidden p-2 transition-opacity hover:opacity-60 sm:block"
            >
              <Search className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.4} />
            </button>
            <div className="group/profile relative hidden sm:block">
              <Link
                href={accountHref}
                aria-label="Профил"
                className="block p-2 transition-opacity hover:opacity-60"
              >
                <User className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.4} />
              </Link>
              {/* hover tooltip — desktop only, doesn't intercept the icon's click */}
              <span
                role="tooltip"
                className="pointer-events-none absolute left-1/2 top-full hidden -translate-x-1/2 translate-y-1 whitespace-nowrap border border-[#e8e6e1] bg-white px-[12px] py-[6px] text-[12px] uppercase leading-tight tracking-widest text-[#0d0d0d] opacity-0 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-opacity duration-150 group-hover/profile:opacity-100 md:block"
              >
                {profileLabel}
              </span>
            </div>
            <button
              type="button"
              aria-label="Кошница"
              onClick={openCart}
              className="relative p-2 transition-opacity hover:opacity-60"
            >
              <ShoppingBag className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.4} />
              {hydrated && count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-noir px-1 text-[0.6rem] font-semibold text-paper">
                  {count}
                </span>
              )}
            </button>
          </div>
        </nav>

        {/* search bar */}
        {searchOpen && (
          <div className="relative z-40 border-t border-hairline bg-paper">
            <form onSubmit={onSearchSubmit} className="gutter mx-auto flex max-w-edge items-center gap-3 py-4">
              <Search className="h-5 w-5 shrink-0 text-ash" strokeWidth={1.4} />
              <input
                ref={searchInputRef}
                type="search"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Търсете продукти…"
                aria-label="Търсене на продукти"
                className="w-full min-w-0 bg-transparent text-base focus:outline-none placeholder:text-ash"
              />
              <button
                type="submit"
                className="shrink-0 text-[0.74rem] uppercase tracking-widest2 font-medium hover:opacity-60"
              >
                Търси
              </button>
              <button
                type="button"
                aria-label="Затвори търсенето"
                onClick={() => setSearchOpen(false)}
                className="-mr-1 shrink-0 p-1"
              >
                <X className="h-5 w-5" strokeWidth={1.4} />
              </button>
            </form>
          </div>
        )}
      </header>

      {/* mobile menu overlay — rendered as a sibling of <header> (not inside it)
          so the header's backdrop-blur doesn't become the containing block for
          this fixed element. Inside the header, `inset-0` resolved against the
          64px navbar instead of the viewport, leaving the drawer see-through
          below the navbar. As a sibling it fills the whole screen. */}
      <div
        className={cn(
          "fixed inset-0 z-50 flex flex-col overflow-y-auto bg-white transition-opacity duration-300 lg:hidden",
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <div className="gutter flex h-16 shrink-0 items-center justify-between border-b border-hairline">
          <span className="eyebrow">Меню</span>
          <button type="button" aria-label="Затвори" onClick={() => setMenuOpen(false)} className="-mr-1 p-1.5">
            <X className="h-5 w-5" strokeWidth={1.4} />
          </button>
        </div>
        <ul className="gutter flex flex-col py-4">
          {NAV_LINKS.map((l) =>
            l.href === "/damsko" ? (
              <li key={l.href} className="border-b border-hairline">
                <button
                  type="button"
                  onClick={() => setDamskoOpen((v) => !v)}
                  aria-expanded={damskoOpen}
                  className="flex w-full items-center justify-between py-5 font-display text-3xl"
                >
                  {l.label}
                  <ChevronDown
                    className={cn("h-6 w-6 transition-transform duration-300", damskoOpen && "rotate-180")}
                    strokeWidth={1.4}
                  />
                </button>
                {damskoOpen && (
                  <ul className="pb-5 pl-1">
                    {DAMSKO_CATEGORIES.map((c) => (
                      <li key={c.label}>
                        <Link
                          href={c.href}
                          onClick={() => {
                            setMenuOpen(false);
                            setDamskoOpen(false);
                          }}
                          className="block py-2.5 text-sm uppercase tracking-widest2 font-medium text-ash"
                        >
                          {c.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ) : (
              <li key={l.href} className="border-b border-hairline">
                <Link
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="block py-5 font-display text-3xl"
                >
                  {l.label}
                </Link>
              </li>
            ),
          )}
        </ul>
        <div className="gutter mt-2 flex flex-col gap-4">
          <Link href={accountHref} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 text-sm">
            <User className="h-4 w-4" strokeWidth={1.4} /> {user ? "Моят профил" : "Вход / Регистрация"}
          </Link>
          <button type="button" onClick={openSearch} className="flex items-center gap-3 text-sm">
            <Search className="h-4 w-4" strokeWidth={1.4} /> Търсене
          </button>
        </div>
      </div>

      {/* search backdrop — click to dismiss */}
      {searchOpen && (
        <div
          aria-hidden
          onClick={() => setSearchOpen(false)}
          className="fixed inset-0 z-30 bg-ink/20 backdrop-blur-[1px]"
        />
      )}
    </>
  );
}
