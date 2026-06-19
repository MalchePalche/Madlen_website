"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient, isSupabaseConfiguredClient } from "@/lib/supabase/client";
import { authErrorBg, siteOrigin } from "@/lib/auth";
import { isEmail } from "@/lib/validation";
import { TextField } from "@/components/ui/TextField";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") || "/akaunt";
  const configured = isSupabaseConfiguredClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // forgot-password sub-flow
  const [forgot, setForgot] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const emailError = touched && !isEmail(email) ? "Невалиден имейл адрес" : undefined;
  const passwordError = touched && !password ? "Въведете парола" : undefined;

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (!isEmail(email) || !password) return;
    if (!configured) {
      setError("Свържете Supabase, за да активирате вход.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setBusy(false);
      setError(authErrorBg(error.message));
      return;
    }
    router.push(redirectTo);
    router.refresh();
  };

  const onReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (!isEmail(email)) return;
    if (!configured) {
      setError("Свържете Supabase, за да активирате възстановяване.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${siteOrigin()}/auth/callback?next=/reset-password`,
    });
    setBusy(false);
    if (error) {
      setError(authErrorBg(error.message));
      return;
    }
    setResetSent(true);
  };

  if (forgot) {
    return (
      <div>
        <h1 className="font-display text-4xl lg:text-5xl">Забравена парола</h1>
        <p className="mt-3 text-sm text-ash">
          Въведете имейла си и ще ви изпратим линк за нова парола.
        </p>

        {resetSent ? (
          <div className="mt-8 flex items-start gap-3 border border-hairline bg-mist p-5 text-sm">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.5} />
            <p>
              Изпратихме линк на <span className="font-medium">{email}</span>. Проверете пощата
              си (и папка „Спам“).
            </p>
          </div>
        ) : (
          <form onSubmit={onReset} noValidate className="mt-8 space-y-5">
            <TextField
              id="reset-email"
              label="Имейл"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={emailError}
            />
            {error && (
              <p role="alert" className="flex items-center gap-2 text-sm text-[#8a2b2b]">
                <AlertCircle className="h-4 w-4" strokeWidth={1.6} /> {error}
              </p>
            )}
            <button type="submit" disabled={busy} className={cn("btn-noir w-full", busy && "opacity-70")}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Изпрати линк"}
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={() => {
            setForgot(false);
            setResetSent(false);
            setError(null);
          }}
          className="mt-6 text-[0.78rem] uppercase tracking-widest2 text-ash hover:text-ink"
        >
          ← Назад към вход
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-4xl lg:text-5xl">Вход</h1>
      <p className="mt-3 text-sm text-ash">
        Нямате акаунт?{" "}
        <Link href="/registraciya" className="text-ink underline underline-offset-4">
          Регистрирайте се
        </Link>
        .
      </p>

      {!configured && (
        <p className="mt-6 border border-hairline bg-mist p-4 text-[0.8rem] text-ash">
          Входът изисква свързан Supabase проект (вижте README).
        </p>
      )}

      <form onSubmit={onLogin} noValidate className="mt-8 space-y-5">
        <TextField
          id="login-email"
          label="Имейл"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={emailError}
        />
        <TextField
          id="login-password"
          label="Парола"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={passwordError}
        />

        <button
          type="button"
          onClick={() => {
            setForgot(true);
            setError(null);
          }}
          className="text-[0.78rem] text-ash underline-offset-4 hover:text-ink hover:underline"
        >
          Забравена парола?
        </button>

        {error && (
          <p role="alert" className="flex items-center gap-2 text-sm text-[#8a2b2b]">
            <AlertCircle className="h-4 w-4" strokeWidth={1.6} /> {error}
          </p>
        )}

        <button type="submit" disabled={busy} className={cn("btn-noir w-full", busy && "opacity-70")}>
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Влизане…
            </>
          ) : (
            "Вход"
          )}
        </button>
      </form>
    </div>
  );
}
