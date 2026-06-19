"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient, isSupabaseConfiguredClient } from "@/lib/supabase/client";
import { authErrorBg, siteOrigin } from "@/lib/auth";
import { isEmail, isPhone, cleanPhone } from "@/lib/validation";
import { TextField } from "@/components/ui/TextField";
import { cn } from "@/lib/utils";

interface Values {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export function RegisterForm() {
  const router = useRouter();
  const configured = isSupabaseConfiguredClient();

  const [v, setV] = useState<Values>({ name: "", email: "", phone: "", password: "" });
  const [attempted, setAttempted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const errors = {
    name: !v.name.trim() ? "Въведете име" : undefined,
    email: !isEmail(v.email) ? "Невалиден имейл адрес" : undefined,
    phone: !isPhone(v.phone) ? "Невалиден номер (напр. 0888123456)" : undefined,
    password: v.password.length < 6 ? "Поне 6 символа" : undefined,
  };
  const show = (k: keyof Values) => (attempted ? errors[k] : undefined);
  const set = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setV((prev) => ({ ...prev, [k]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    setError(null);
    if (Object.values(errors).some(Boolean)) return;
    if (!configured) {
      setError("Регистрацията изисква свързан Supabase проект.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: v.email.trim(),
      password: v.password,
      options: {
        data: { full_name: v.name.trim(), phone: cleanPhone(v.phone) },
        emailRedirectTo: `${siteOrigin()}/auth/callback?next=/akaunt`,
      },
    });
    if (error) {
      setBusy(false);
      setError(authErrorBg(error.message));
      return;
    }
    if (data.session) {
      // email confirmation disabled — logged in immediately
      router.push("/akaunt");
      router.refresh();
      return;
    }
    setBusy(false);
    setSent(true);
  };

  if (sent) {
    return (
      <div>
        <h1 className="font-display text-4xl lg:text-5xl">Почти готово</h1>
        <div className="mt-8 flex items-start gap-3 border border-hairline bg-mist p-5 text-sm">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.5} />
          <p>
            Изпратихме линк за потвърждение на <span className="font-medium">{v.email}</span>.
            Отворете го, за да активирате акаунта си.
          </p>
        </div>
        <Link href="/vlez" className="btn-outline mt-6">
          Към вход
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-4xl lg:text-5xl">Регистрация</h1>
      <p className="mt-3 text-sm text-ash">
        Вече имате акаунт?{" "}
        <Link href="/vlez" className="text-ink underline underline-offset-4">
          Влезте
        </Link>
        .
      </p>

      {!configured && (
        <p className="mt-6 border border-hairline bg-mist p-4 text-[0.8rem] text-ash">
          Регистрацията изисква свързан Supabase проект (вижте README).
        </p>
      )}

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        <TextField id="reg-name" label="Име и фамилия" required autoComplete="name" value={v.name} onChange={set("name")} error={show("name")} />
        <TextField id="reg-email" label="Имейл" type="email" required autoComplete="email" value={v.email} onChange={set("email")} error={show("email")} />
        <TextField id="reg-phone" label="Телефон" type="tel" required autoComplete="tel" placeholder="0888 123 456" value={v.phone} onChange={set("phone")} error={show("phone")} />
        <TextField id="reg-password" label="Парола" type="password" required autoComplete="new-password" placeholder="мин. 6 символа" value={v.password} onChange={set("password")} error={show("password")} />

        {error && (
          <p role="alert" className="flex items-center gap-2 text-sm text-[#8a2b2b]">
            <AlertCircle className="h-4 w-4" strokeWidth={1.6} /> {error}
          </p>
        )}

        <button type="submit" disabled={busy} className={cn("btn-noir w-full", busy && "opacity-70")}>
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Създаване…
            </>
          ) : (
            "Създай акаунт"
          )}
        </button>
        <p className="text-center text-[0.72rem] text-ash">
          С регистрацията приемате Общите условия и Политиката за поверителност.
        </p>
      </form>
    </div>
  );
}
