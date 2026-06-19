"use client";

import { useState } from "react";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cleanPhone, isPhone, isPostcode } from "@/lib/validation";
import { TextField } from "@/components/ui/TextField";
import type { DeliveryAddress } from "@/lib/types";
import { cn } from "@/lib/utils";

type Field = "first_name" | "last_name" | "phone" | "address" | "city" | "postcode";

export function DefaultAddress({
  userId,
  initial,
}: {
  userId: string;
  initial: DeliveryAddress | null;
}) {
  const [v, setV] = useState<Record<Field, string>>({
    first_name: initial?.first_name ?? "",
    last_name: initial?.last_name ?? "",
    phone: initial?.phone ?? "",
    address: initial?.address ?? "",
    city: initial?.city ?? "",
    postcode: initial?.postcode ?? "",
  });
  const [attempted, setAttempted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errors: Partial<Record<Field, string>> = {
    first_name: !v.first_name.trim() ? "Въведете име" : undefined,
    last_name: !v.last_name.trim() ? "Въведете фамилия" : undefined,
    phone: !isPhone(v.phone) ? "Невалиден номер" : undefined,
    address: !v.address.trim() ? "Въведете адрес" : undefined,
    city: !v.city.trim() ? "Въведете град" : undefined,
    postcode: !isPostcode(v.postcode) ? "4 цифри" : undefined,
  };
  const show = (k: Field) => (attempted ? errors[k] : undefined);
  const set = (k: Field) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setV((prev) => ({ ...prev, [k]: e.target.value }));

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    setError(null);
    setSaved(false);
    if (Object.values(errors).some(Boolean)) return;
    setBusy(true);
    const address: DeliveryAddress = {
      first_name: v.first_name.trim(),
      last_name: v.last_name.trim(),
      phone: cleanPhone(v.phone),
      address: v.address.trim(),
      city: v.city.trim(),
      postcode: v.postcode.trim(),
    };
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: userId, default_address: address }, { onConflict: "id" });
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
      <h2 className="text-[0.8rem] uppercase tracking-widest2 font-semibold">Адрес за доставка</h2>
      <p className="mt-2 text-[0.78rem] text-ash">Използва се автоматично при поръчка.</p>
      <form onSubmit={onSave} noValidate className="mt-5 grid gap-5 sm:grid-cols-2">
        <TextField id="addr-first" label="Име" required value={v.first_name} onChange={set("first_name")} error={show("first_name")} autoComplete="given-name" />
        <TextField id="addr-last" label="Фамилия" required value={v.last_name} onChange={set("last_name")} error={show("last_name")} autoComplete="family-name" />
        <TextField id="addr-phone" label="Телефон" type="tel" required value={v.phone} onChange={set("phone")} error={show("phone")} autoComplete="tel" className="sm:col-span-2" />
        <TextField id="addr-street" label="Адрес" required value={v.address} onChange={set("address")} error={show("address")} autoComplete="street-address" className="sm:col-span-2" />
        <TextField id="addr-city" label="Град" required value={v.city} onChange={set("city")} error={show("city")} autoComplete="address-level2" />
        <TextField id="addr-postcode" label="Пощенски код" required inputMode="numeric" maxLength={4} value={v.postcode} onChange={set("postcode")} error={show("postcode")} autoComplete="postal-code" />

        {error && (
          <p role="alert" className="flex items-center gap-2 text-sm text-[#8a2b2b] sm:col-span-2">
            <AlertCircle className="h-4 w-4" strokeWidth={1.6} /> {error}
          </p>
        )}

        <button type="submit" disabled={busy} className={cn("btn-noir w-full sm:col-span-2", busy && "opacity-70")}>
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <>
              <Check className="h-4 w-4" strokeWidth={2} /> Запазено
            </>
          ) : (
            "Запази адреса"
          )}
        </button>
      </form>
    </section>
  );
}
