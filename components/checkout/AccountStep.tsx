"use client";

import { useState } from "react";
import { Loader2, AlertCircle, CheckCircle2, LogIn, UserPlus, ArrowRight } from "lucide-react";
import { createClient, isSupabaseConfiguredClient } from "@/lib/supabase/client";
import { authErrorBg, siteOrigin } from "@/lib/auth";
import { isEmail, isPhone, cleanPhone } from "@/lib/validation";
import { TextField } from "@/components/ui/TextField";
import { cn } from "@/lib/utils";

type Mode = "choose" | "login" | "register";

/**
 * Pre-checkout account step shown to guests before the order form. Sign-in /
 * registration happen inline (no redirect) so a successful auth simply lets the
 * parent swap in the prefilled checkout form via the shared auth context. The
 * guest option collapses straight to the form. Already-signed-in shoppers never
 * see this — the parent skips it entirely.
 */
export function AccountStep({ onGuest }: { onGuest: () => void }) {
  const configured = isSupabaseConfiguredClient();
  const [mode, setMode] = useState<Mode>("choose");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Shared across login/register; register also uses name + phone.
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [sent, setSent] = useState(false); // register awaiting email confirmation

  const back = () => {
    setMode("choose");
    setError(null);
    setAttempted(false);
    setSent(false);
  };

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    setError(null);
    if (!isEmail(email) || !password) return;
    if (!configured) {
      setError("Входът изисква свързан Supabase проект.");
      return;
    }
    setBusy(true);
    const { error } = await createClient().auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setBusy(false);
      setError(authErrorBg(error.message));
      return;
    }
    // Success: AuthProvider picks up the session and the parent swaps in the
    // prefilled checkout form. Keep the spinner until that re-render unmounts us.
  };

  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    setError(null);
    if (!name.trim() || !isEmail(email) || !isPhone(phone) || password.length < 6) return;
    if (!configured) {
      setError("Регистрацията изисква свързан Supabase проект.");
      return;
    }
    setBusy(true);
    const { data, error } = await createClient().auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: name.trim(), phone: cleanPhone(phone) },
        emailRedirectTo: `${siteOrigin()}/auth/callback?next=/akaunt`,
      },
    });
    if (error) {
      setBusy(false);
      setError(authErrorBg(error.message));
      return;
    }
    // Session present → logged in immediately; parent swaps in the form.
    if (data.session) return;
    // Otherwise email confirmation is required — let them order as guest now.
    setBusy(false);
    setSent(true);
  };

  const loginErr = attempted && !isEmail(email) ? "Невалиден имейл адрес" : undefined;
  const passErr = (k: "login" | "register") => {
    if (!attempted) return undefined;
    if (k === "login") return !password ? "Въведете парола" : undefined;
    return password.length < 6 ? "Поне 6 символа" : undefined;
  };

  return (
    <div className="mx-auto max-w-xl border border-hairline bg-paper p-6 lg:p-8">
      {mode === "choose" && (
        <>
          <p className="eyebrow">Профил</p>
          <h2 className="mt-3 font-display text-2xl lg:text-3xl">Как желаете да продължите?</h2>
          <p className="mt-2 text-sm text-ash">
            Влезте или се регистрирайте, за да следим поръчките ви и да запазим данните за
            доставка — или продължете като гост.
          </p>

          <div className="mt-6 space-y-3">
            <button type="button" onClick={() => setMode("login")} className="btn-noir w-full">
              <LogIn className="h-4 w-4" strokeWidth={1.6} /> Вход
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className="btn-outline w-full"
            >
              <UserPlus className="h-4 w-4" strokeWidth={1.6} /> Регистрация
            </button>
          </div>

          <div className="my-6 flex items-center gap-4 text-[0.68rem] uppercase tracking-widest2 text-ash">
            <span className="h-px flex-1 bg-hairline" />
            или
            <span className="h-px flex-1 bg-hairline" />
          </div>

          <button
            type="button"
            onClick={onGuest}
            className="group mx-auto flex items-center gap-2 text-sm text-ash transition-colors hover:text-ink"
          >
            Продължи като гост
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              strokeWidth={1.6}
            />
          </button>
        </>
      )}

      {mode === "login" && (
        <>
          <p className="eyebrow">Вход</p>
          <h2 className="mt-3 font-display text-2xl lg:text-3xl">Влезте в акаунта си</h2>

          {!configured && (
            <p className="mt-5 border border-hairline bg-mist p-4 text-[0.8rem] text-ash">
              Входът изисква свързан Supabase проект (вижте README).
            </p>
          )}

          <form onSubmit={onLogin} noValidate className="mt-6 space-y-5">
            <TextField
              id="acc-login-email"
              label="Имейл"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={loginErr}
            />
            <TextField
              id="acc-login-password"
              label="Парола"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={passErr("login")}
            />

            {error && (
              <p role="alert" className="flex items-center gap-2 text-sm text-[#8a2b2b]">
                <AlertCircle className="h-4 w-4" strokeWidth={1.6} /> {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className={cn("btn-noir w-full", busy && "opacity-70")}
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Влизане…
                </>
              ) : (
                "Вход"
              )}
            </button>
          </form>

          <BackButton onClick={back} />
        </>
      )}

      {mode === "register" && (
        <>
          <p className="eyebrow">Регистрация</p>
          <h2 className="mt-3 font-display text-2xl lg:text-3xl">Създайте акаунт</h2>

          {!configured && (
            <p className="mt-5 border border-hairline bg-mist p-4 text-[0.8rem] text-ash">
              Регистрацията изисква свързан Supabase проект (вижте README).
            </p>
          )}

          {sent ? (
            <div className="mt-6">
              <div className="flex items-start gap-3 border border-hairline bg-mist p-5 text-sm">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.5} />
                <p>
                  Изпратихме линк за потвърждение на <span className="font-medium">{email}</span>.
                  Можете да го отворите по-късно — а сега да завършите поръчката като гост.
                </p>
              </div>
              <button type="button" onClick={onGuest} className="btn-noir mt-6 w-full">
                Продължи към поръчката
                <ArrowRight className="h-4 w-4" strokeWidth={1.6} />
              </button>
            </div>
          ) : (
            <form onSubmit={onRegister} noValidate className="mt-6 space-y-5">
              <TextField
                id="acc-reg-name"
                label="Име и фамилия"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={attempted && !name.trim() ? "Въведете име" : undefined}
              />
              <TextField
                id="acc-reg-email"
                label="Имейл"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={loginErr}
              />
              <TextField
                id="acc-reg-phone"
                label="Телефон"
                type="tel"
                required
                autoComplete="tel"
                placeholder="0888 123 456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                error={attempted && !isPhone(phone) ? "Невалиден номер (напр. 0888123456)" : undefined}
              />
              <TextField
                id="acc-reg-password"
                label="Парола"
                type="password"
                required
                autoComplete="new-password"
                placeholder="мин. 6 символа"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={passErr("register")}
              />

              {error && (
                <p role="alert" className="flex items-center gap-2 text-sm text-[#8a2b2b]">
                  <AlertCircle className="h-4 w-4" strokeWidth={1.6} /> {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className={cn("btn-noir w-full", busy && "opacity-70")}
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Създаване…
                  </>
                ) : (
                  "Създай акаунт"
                )}
              </button>
            </form>
          )}

          {!sent && <BackButton onClick={back} />}
        </>
      )}
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-6 text-[0.78rem] uppercase tracking-widest2 text-ash hover:text-ink"
    >
      ← Назад
    </button>
  );
}
