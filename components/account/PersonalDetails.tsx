"use client";

import { useState } from "react";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cleanPhone, isPhone } from "@/lib/validation";
import { TextField } from "@/components/ui/TextField";
import { cn } from "@/lib/utils";

export function PersonalDetails({
  userId,
  email,
  initialName,
  initialPhone,
}: {
  userId: string;
  email: string;
  initialName: string;
  initialPhone: string;
}) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [attempted, setAttempted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameError = attempted && !name.trim() ? "Въведете име" : undefined;
  const phoneError = attempted && !isPhone(phone) ? "Невалиден номер" : undefined;

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    setError(null);
    setSaved(false);
    if (!name.trim() || !isPhone(phone)) return;
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: userId, full_name: name.trim(), phone: cleanPhone(phone) }, { onConflict: "id" });
    setBusy(false);
    if (error) {
      setError("Грешка при запазване. Опитайте отново.");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <section className="border border-hairline p-6">
      <h2 className="text-[0.8rem] uppercase tracking-widest2 font-semibold">Лични данни</h2>
      <form onSubmit={onSave} noValidate className="mt-5 space-y-5">
        <TextField id="acc-name" label="Име и фамилия" required value={name} onChange={(e) => setName(e.target.value)} error={nameError} autoComplete="name" />
        <TextField id="acc-phone" label="Телефон" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} error={phoneError} autoComplete="tel" />
        <div>
          <label className="block text-[0.74rem] uppercase tracking-widest2 text-ash">Имейл</label>
          <input
            value={email}
            disabled
            className="mt-2 w-full border border-hairline bg-mist px-3.5 py-3 text-sm text-ash"
          />
        </div>

        {error && (
          <p role="alert" className="flex items-center gap-2 text-sm text-[#8a2b2b]">
            <AlertCircle className="h-4 w-4" strokeWidth={1.6} /> {error}
          </p>
        )}

        <button type="submit" disabled={busy} className={cn("btn-noir w-full", busy && "opacity-70")}>
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <>
              <Check className="h-4 w-4" strokeWidth={2} /> Запазено
            </>
          ) : (
            "Запази промените"
          )}
        </button>
      </form>
    </section>
  );
}
