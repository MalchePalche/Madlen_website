/**
 * Central brand configuration for Noem Studio.
 * Change BRAND.name here to rebrand the entire site in one place.
 */
/**
 * Public base URL of the storefront, used to build absolute links (emails,
 * sitemap, etc.). Override per environment with NEXT_PUBLIC_SITE_URL; the
 * production domain is the fallback so links are never relative in emails.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://noem-studio.com"
).replace(/\/+$/, "");

export const BRAND = {
  name: "Noem Studio",
  tagline: "Българска мода за мъже и жени",
  season: "ЛЯТО 2026",
  email: "noem.studio.bg@gmail.com",
  phone: "+359 88 123 4567",
  freeShippingThreshold: 100,
  social: {
    instagram: "https://www.instagram.com/noem_studio/",
    facebook: "https://www.facebook.com/profile.php?id=61575796677380",
    tiktok: "https://tiktok.com",
  },
} as const;

/** Primary navigation tabs (left side of the navbar). */
export const NAV_LINKS = [
  { label: "Ново", href: "/novo" },
  { label: "Дамско", href: "/damsko" },
  { label: "Мъжко", href: "/muzhko" },
  { label: "Намаления", href: "/namalenia" },
] as const;

/** Product categories used for the homepage pills and collection filters. */
export const CATEGORIES = [
  { slug: "rokli", label: "Рокли" },
  { slug: "setove", label: "Сетове" },
  { slug: "topove", label: "Топове" },
  { slug: "pantaloni", label: "Панталони" },
  { slug: "vrahni", label: "Връхни" },
  { slug: "aksesoari", label: "Аксесоари" },
] as const;

/** Gender options (admin product form + labels). */
export const GENDER_OPTIONS = [
  { value: "female", label: "Дамско" },
  { value: "male", label: "Мъжко" },
  { value: "unisex", label: "Унисекс" },
] as const;

/** Single-size products (accessories etc.) carry this instead of a size run. */
export const ONE_SIZE = "One size";

/** Sizes offered across the catalogue (admin product form). */
export const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", ONE_SIZE] as const;

/** Bulgarian label for a category slug, falling back to the raw slug. */
export function categoryLabel(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}

/** Bulgarian label for a gender value, falling back to the raw value. */
export function genderLabel(value: string): string {
  return GENDER_OPTIONS.find((g) => g.value === value)?.label ?? value;
}

/** Footer link columns. */
export const FOOTER_LINKS = [
  {
    title: "Магазин",
    links: [
      { label: "Мъжко", href: "/muzhko" },
      { label: "Дамско", href: "/damsko" },
      { label: "Нови продукти", href: "/novo" },
      { label: "Намаления", href: "/namalenia" },
      { label: "Всички категории", href: "/novo" },
    ],
  },
  {
    title: "Помощ",
    links: [
      { label: "Доставка", href: "/dostavka" },
      { label: "Връщане", href: "/vryshtane" },
      { label: "Размерна таблица", href: "/razmerna-tablica" },
      { label: "Контакти", href: "/kontakti" },
    ],
  },
  {
    title: "Профил",
    links: [
      { label: "Вход", href: "/vlez" },
      { label: "Регистрация", href: "/registraciya" },
      { label: "Моят профил", href: "/akaunt" },
    ],
  },
] as const;
