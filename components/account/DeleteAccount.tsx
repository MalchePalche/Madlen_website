"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, Trash2 } from "lucide-react";
import { useUser } from "@/components/auth/AuthProvider";

export function DeleteAccount() {
  const { signOut } = useUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onConfirm = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/delete-account", { method: "POST" });
      if (!res.ok) {
        setBusy(false);
        setError("Неуспешно изтриване. Моля, опитайте отново.");
        return;
      }
    } catch {
      setBusy(false);
      setError("Неуспешно изтриване. Моля, опитайте отново.");
      return;
    }
    // Account is gone server-side — clear the local session and leave.
    await signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <section className="mt-16 border-t border-hairline pt-10">
      <h2 className="text-[0.8rem] uppercase tracking-widest2 font-semibold text-[#8a2b2b]">
        Зона за изтриване на данни
      </h2>
      <p className="mt-2 max-w-xl text-[0.82rem] text-ash">
        Изтриването премахва вашия профил и всички лични данни. Историята на поръчките се
        запазва анонимно за счетоводни и правни цели.
      </p>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="mt-5 inline-flex items-center gap-2 border border-red-300 px-6 py-3 text-[0.72rem] font-semibold uppercase tracking-widest2 text-red-600 transition-colors hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" strokeWidth={1.6} />
        Изтрий профила и данните ми
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-noir/40 p-5"
          role="dialog"
          aria-modal="true"
          onClick={() => !busy && setOpen(false)}
        >
          <div
            className="w-full max-w-sm border border-hairline bg-paper p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-2xl">Сигурни ли сте?</h2>
            <p className="mt-3 text-sm text-ash">
              Това ще изтрие вашия профил, всички лични данни и история на поръчките.
              Действието е необратимо.
            </p>

            {error && (
              <p role="alert" className="mt-4 flex items-center gap-2 text-sm text-[#8a2b2b]">
                <AlertCircle className="h-4 w-4" strokeWidth={1.6} /> {error}
              </p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={busy}
                className="btn-outline flex-1 disabled:opacity-60"
              >
                Отказ
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={busy}
                className="inline-flex flex-1 items-center justify-center gap-2 bg-[#8a2b2b] px-8 py-4 text-[0.72rem] font-semibold uppercase tracking-widest2 text-paper transition-colors hover:bg-[#741f1f] disabled:opacity-70"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Изтрий завинаги"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
