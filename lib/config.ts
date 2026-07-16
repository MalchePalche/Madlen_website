/**
 * Central brand configuration for Noem Studio.
 * Change BRAND.name here to rebrand the entire site in one place.
 */
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
  stores: [
    { city: "София", address: "бул. Витоша 12", hours: "Пон–Съб 10:00–20:00" },
    { city: "Пловдив", address: "ул. Главна 45", hours: "Пон–Съб 10:00–19:00" },
  ],
} as const;

/** Primary navigation tabs (left side of the navbar). */
export const NAV_LINKS = [
  { label: "Ново", href: "/novo" },
  { label: "Дамско", href: "/damsko" },
  { label: "Мъжко", href: "/muzhko" },
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
