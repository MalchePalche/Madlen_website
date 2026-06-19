/** Map Supabase auth error messages to friendly Bulgarian copy. */
export function authErrorBg(message?: string): string {
  if (!message) return "Възникна грешка. Моля, опитайте отново.";
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "Грешен имейл или парола.";
  if (m.includes("email not confirmed")) return "Имейлът не е потвърден. Проверете пощата си.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Вече съществува акаунт с този имейл.";
  if (m.includes("password should be at least") || m.includes("at least 6"))
    return "Паролата трябва да е поне 6 символа.";
  if (m.includes("invalid email") || m.includes("unable to validate email"))
    return "Невалиден имейл адрес.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Твърде много опити. Опитайте отново по-късно.";
  if (m.includes("same") && m.includes("password"))
    return "Новата парола трябва да е различна от старата.";
  return "Възникна грешка. Моля, опитайте отново.";
}

/** Absolute origin for building auth redirect URLs. */
export function siteOrigin(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
