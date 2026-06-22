"use client";

import { useState } from "react";
import { Send, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { BRAND } from "@/lib/config";
import { isEmail, isPhone } from "@/lib/validation";
import { TextField } from "@/components/ui/TextField";
import { cn } from "@/lib/utils";

type Field = "name" | "email" | "phone" | "message";

export function ContactForm() {
  const [v, setV] = useState<Record<Field, string>>({ name: "", email: "", phone: "", message: "" });
  const [attempted, setAttempted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errors = {
    name: !v.name.trim() ? "Въведете име" : undefined,
    email: !isEmail(v.email) ? "Невалиден имейл адрес" : undefined,
    phone: v.phone.trim() && !isPhone(v.phone) ? "Невалиден номер" : undefined,
    message: v.message.trim().length < 5 ? "Въведете съобщение" : undefined,
  };
  const show = (k: Field) => (attempted ? errors[k] : undefined);
  const set = (k: Field) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setV((prev) => ({ ...prev, [k]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    setError(null);
    if (errors.name || errors.email || errors.phone || errors.message) return;

    setBusy(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: v.name.trim(),
          email: v.email.trim(),
          phone: v.phone.trim(),
          message: v.message.trim(),
        }),
      });
      if (!res.ok) throw new Error("request failed");
      setSent(true);
    } catch {
      setBusy(false);
      setError("Съобщението не беше изпратено. Опитайте отново или ни пишете директно.");
    }
  };

  if (sent) {
    return (
      <div className="flex items-start gap-3 border border-hairline bg-mist p-6 text-sm">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.5} />
        <p className="leading-relaxed">
          Благодарим! Получихме съобщението ви и ще се свържем с вас възможно най-скоро. При спешност
          ни пишете директно на{" "}
          <a href={`mailto:${BRAND.email}`} className="text-ink underline underline-offset-4">
            {BRAND.email}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <TextField id="c-name" label="Име" required value={v.name} onChange={set("name")} error={show("name")} autoComplete="name" />
      <TextField id="c-email" label="Имейл" type="email" required value={v.email} onChange={set("email")} error={show("email")} autoComplete="email" />
      <TextField id="c-phone" label="Телефон (по избор)" type="tel" value={v.phone} onChange={set("phone")} error={show("phone")} autoComplete="tel" />
      <div>
        <label htmlFor="c-message" className="block text-[0.74rem] uppercase tracking-widest2 text-ash">
          Съобщение <span aria-hidden>*</span>
        </label>
        <textarea
          id="c-message"
          rows={5}
          required
          value={v.message}
          onChange={set("message")}
          aria-invalid={!!show("message")}
          className="mt-2 w-full resize-none border border-hairline bg-paper px-3.5 py-3 text-sm focus:border-ink focus:outline-none"
        />
        {show("message") && <p className="mt-1.5 text-[0.74rem] text-[#8a2b2b]">{show("message")}</p>}
      </div>

      {error && (
        <p role="alert" className="flex items-center gap-2 text-sm text-[#8a2b2b]">
          <AlertCircle className="h-4 w-4" strokeWidth={1.6} /> {error}
        </p>
      )}

      <button type="submit" disabled={busy} className={cn("btn-noir w-full", busy && "opacity-70")}>
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> Изпращане…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" strokeWidth={1.6} /> Изпрати съобщение
          </>
        )}
      </button>
    </form>
  );
}
