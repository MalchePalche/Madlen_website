# MADLEN — модна е-търговия

Минималистичен онлайн магазин за дамско и мъжко облекло. Next.js 14 (App Router) ·
Supabase · Tailwind CSS · плащане само с наложен платеж (без платежен шлюз).

## Стек

- **Next.js 14** (App Router, Server Components)
- **Supabase** — продукти, поръчки, автентикация (`@supabase/ssr`)
- **Tailwind CSS** — дизайн система с RGB-channel токени
- **Zustand** — кошница, запазена в `localStorage`
- **Framer Motion** — слайд кошница и анимации при скрол
- Шрифтове: **Prata** (дисплей) + **Manrope** (текст), пълна кирилица

## Локално стартиране

```bash
npm install
cp .env.local.example .env.local   # попълнете Supabase ключовете
npm run dev                         # http://localhost:3000
```

> Преди да зададете Supabase ключове, сайтът работи върху локалния
> резервен каталог (`lib/mock-products.ts`), така че всичко е видимо веднага.

## Supabase

1. Създайте проект в [supabase.com](https://supabase.com).
2. SQL Editor → изпълнете `supabase/schema.sql` (таблици, RLS, тригери).
3. SQL Editor → изпълнете `supabase/seed.sql` (примерни продукти).
4. Project Settings → API → копирайте `URL` и `anon` ключа в `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Данните се четат през `lib/products.ts`, който автоматично преминава към
резервния каталог, ако Supabase не е конфигуриран или заявка се провали.

### Автентикация (Supabase Auth)

Имейл/парола вход през `@supabase/ssr`. За да работят имейл линковете:

1. **Authentication → URL Configuration**: задайте `Site URL` (напр.
   `http://localhost:3000`) и добавете в `Redirect URLs`:
   `http://localhost:3000/auth/callback` и `http://localhost:3000/reset-password`
   (плюс продукционния домейн).
2. Потвърждение на имейл и възстановяване на парола минават през
   `app/auth/callback/route.ts`, който обменя кода за сесия.
3. Тригерът `handle_new_user` (в `schema.sql`) създава ред в `profiles` при
   регистрация, попълвайки `full_name` и `phone` от метаданните.

Маршрути: `/vlez` (вход), `/registraciya` (регистрация), `/akaunt` (профил —
защитен), `/reset-password` (нова парола). Защитата на `/akaunt` е в
`middleware.ts`.

## Структура

```
app/                # маршрути (App Router)
  (auth)            # vlez, registraciya, reset-password, auth/callback
  akaunt/           # защитен профил (лични данни, адрес, поръчки)
  porachka*/        # checkout + страница за успешна поръчка
components/
  layout/           # AnnouncementBar, Navbar, Footer
  cart/             # CartDrawer (слайд кошница)
  product/          # ProductCard, ProductGrid, ProductGallery, BuyPanel
  collection/       # Collection, FilterBar
  checkout/         # CheckoutForm, OrderSummary, GuestSavePrompt
  account/          # PersonalDetails, DefaultAddress, OrderHistory, SignOutButton
  auth/             # AuthProvider, LoginForm, RegisterForm, ResetPasswordForm
  ui/               # Reveal, Accordion, TextField
lib/                # config, types, products, orders, auth, validation, supabase/*
store/              # cart.ts (Zustand)
supabase/           # schema.sql, seed.sql
middleware.ts       # обновяване на сесия + защита на /akaunt
```

## Команди

| Команда         | Описание                          |
| --------------- | --------------------------------- |
| `npm run dev`   | Дев сървър                        |
| `npm run build` | Продукционен билд                 |
| `npm run start` | Стартиране на билда               |
| `npm run lint`  | ESLint                            |

## Деплой

Vercel + променливите от `.env.local` в Project Settings → Environment Variables.

## Бранд

Името на марката е централизирано в [`lib/config.ts`](lib/config.ts) (`BRAND.name`).
Промяната му там сменя логото, footer-а и мета данните навсякъде.
