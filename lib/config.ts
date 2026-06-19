/**
 * Central brand configuration for Madlen.
 * Change BRAND.name here to rebrand the entire site in one place.
 */
export const BRAND = {
  name: "MADLEN",
  tagline: "Българска мода за мъже и жени",
  season: "ЛЯТО 2026",
  email: "info@madlen.bg",
  phone: "+359 88 123 4567",
  freeShippingThreshold: 100,
  social: {
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
    tiktok: "https://tiktok.com",
  },
  stores: [
    { city: "София", address: "бул. Витоша 12", hours: "Пон–Съб 10:00–20:00" },
    { city: "Пловдив", address: "ул. Главна 45", hours: "Пон–Съб 10:00–19:00" },
  ],
} as const;

/** Primary navigation tabs (left side of the navbar). */
export const NAV_LINKS = [
  { label: "Мъжко", href: "/muzhko" },
  { label: "Дамско", href: "/damsko" },
  { label: "Ново", href: "/novo" },
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
      { label: "Връщане", href: "/vrashtane" },
      { label: "Размерна таблица", href: "/razmeri" },
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
