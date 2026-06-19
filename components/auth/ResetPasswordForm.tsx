"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient, isSupabaseConfiguredClient } from "@/lib/supabase/client";
import { authErrorBg } from "@/lib/auth";
import { TextField } from "@/components/ui/TextField";
import { cn } from "@/lib/utils";

export function ResetPasswordForm() {
  const router = useRouter();

  // undefined = checking; true = recovery session present; false = no valid session
  const [ready, setReady] = useState<boolean | undefined>(undefined);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfiguredClient()) {
      setReady(false);
      return;
    }
    const supabase = createClient();

    const init = async () => {
      // If the callback didn't run, try exchanging a ?code here.
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        try {
          await supabase.auth.exchangeCodeForSession(code);
        } catch {
          /* fall through to session check */
        }
      }
      const { data } = await supabase.auth.getUser();
      setReady(!!data.user);
    };
    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const pwError = attempted && password.length < 6 ? "Поне 6 символа" : undefined;
  const confirmError = attempted && confirm !== password ? "Паролите не съвпадат" : undefined;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    setError(null);
    if (password.length < 6 || confirm !== password) return;
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setBusy(false);
      setError(authErrorBg(error.message));
      return;
    }
    setDone(true);
    setTimeout(() => {
      router.push("/akaunt");
      router.refresh();
    }, 1400);
  };

  if (ready === undefined) {
    return <p className="py-16 text-center text-sm text-ash">Зареждане…</p>;
  }

  if (!ready) {
    return (
      <div>
        <h1 className="font-display text-4xl lg:text-5xl">Невалиден линк</h1>
        <p className="mt-3 text-sm text-ash">
          Линкът за смяна на парола е невалиден или изтекъл.
        </p>
        <Link href="/vlez" className="btn-noir mt-8">
          Заяви нов линк
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto h-12 w-12" strokeWidth={1} />
        <h1 className="mt-5 font-display text-3xl">Паролата е сменена</h1>
        <p className="mt-2 text-sm text-ash">Пренасочваме ви към профила…</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-4xl lg:text-5xl">Нова парола</h1>
      <p className="mt-3 text-sm text-ash">Изберете нова парола за акаунта си.</p>

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        <TextField
          id="new-password"
          label="Нова парола"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={pwError}
        />
        <TextField
          id="confirm-password"
          label="Повторете паролата"
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={confirmError}
        />

        {error && (
          <p role="alert" className="flex items-center gap-2 text-sm text-[#8a2b2b]">
            <AlertCircle className="h-4 w-4" strokeWidth={1.6} /> {error}
          </p>
        )}

        <button type="submit" disabled={busy} className={cn("btn-noir w-full", busy && "opacity-70")}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Запази новата парола"}
        </button>
      </form>
    </div>
  );
}
