"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, CheckCircle2, UserPlus } from "lucide-react";
import { useUser } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfiguredClient } from "@/lib/supabase/client";
import { authErrorBg, siteOrigin } from "@/lib/auth";
import { cn } from "@/lib/utils";

/**
 * Shown to guests on the confirmation page: one click sends a passwordless
 * sign-in link to the email entered at checkout, creating their account.
 */
export function GuestSavePrompt({
  email,
  name,
  phone,
}: {
  email?: string;
  name?: string;
  phone?: string;
}) {
  const { user, loading } = useUser();
  const configured = isSupabaseConfiguredClient();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already logged in (or still resolving) — nothing to offer.
  if (loading || user) return null;

  const onSave = async () => {
    if (!email) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        data: name ? { full_name: name, phone } : { phone },
        emailRedirectTo: `${siteOrigin()}/auth/callback?next=/akaunt`,
      },
    });
    setBusy(false);
    if (error) {
      setError(authErrorBg(error.message));
      return;
    }
    setSent(true);
  };

  return (
    <div className="mt-10 border border-ink bg-paper p-6 text-left">
      <p className="eyebrow flex items-center gap-2">
        <UserPlus className="h-4 w-4" strokeWidth={1.5} /> Запази данните си
      </p>

      {sent ? (
        <div className="mt-3 flex items-start gap-3 text-sm">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.5} />
          <p>
            Изпратихме линк за вход на <span className="font-medium">{email}</span>. Отворете го,
            за да завършите създаването на акаунта.
          </p>
        </div>
      ) : (
        <>
          <h2 className="mt-3 font-display text-2xl">Създайте акаунт за по-бързи поръчки</h2>
          <p className="mt-2 text-sm text-ash">
            Запазваме вашите данни за доставка и историята на поръчките. Без парола — изпращаме
            линк за вход.
          </p>

          {error && (
            <p role="alert" className="mt-3 flex items-center gap-2 text-sm text-[#8a2b2b]">
              <AlertCircle className="h-4 w-4" strokeWidth={1.6} /> {error}
            </p>
          )}

          {configured && email ? (
            <button type="button" onClick={onSave} disabled={busy} className={cn("btn-noir mt-5", busy && "opacity-70")}>
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Изпращане…
                </>
              ) : (
                <>Запази с {email}</>
              )}
            </button>
          ) : (
            <Link href="/registraciya" className="btn-noir mt-5">
              Към регистрация
            </Link>
          )}
        </>
      )}
    </div>
  );
}
