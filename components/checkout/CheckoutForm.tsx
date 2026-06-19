"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingBag, Banknote, Loader2, AlertCircle } from "lucide-react";
import { useCart, selectSubtotal } from "@/store/cart";
import { OrderSummary } from "./OrderSummary";
import { createOrder, deliveryCost, newOrderId, saveLastOrder } from "@/lib/orders";
import { createClient, isSupabaseConfiguredClient } from "@/lib/supabase/client";
import { cleanPhone, PHONE_RE, EMAIL_RE, POSTCODE_RE } from "@/lib/validation";
import { TextField } from "@/components/ui/TextField";
import type { DeliveryAddress } from "@/lib/types";
import { cn } from "@/lib/utils";

type Field =
  | "first_name"
  | "last_name"
  | "phone"
  | "email"
  | "address"
  | "city"
  | "postcode"
  | "note";

const FIELD_ORDER: Field[] = [
  "first_name",
  "last_name",
  "phone",
  "email",
  "address",
  "city",
  "postcode",
];

type Values = Record<Field, string>;
const EMPTY: Values = {
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  postcode: "",
  note: "",
};

function validate(v: Values): Partial<Record<Field, string>> {
  const e: Partial<Record<Field, string>> = {};
  if (!v.first_name.trim()) e.first_name = "Въведете име";
  if (!v.last_name.trim()) e.last_name = "Въведете фамилия";
  if (!v.phone.trim()) e.phone = "Въведете телефон";
  else if (!PHONE_RE.test(cleanPhone(v.phone))) e.phone = "Невалиден номер (напр. 0888123456)";
  if (v.email.trim() && !EMAIL_RE.test(v.email.trim())) e.email = "Невалиден имейл адрес";
  if (!v.address.trim()) e.address = "Въведете адрес";
  if (!v.city.trim()) e.city = "Въведете град";
  if (!v.postcode.trim()) e.postcode = "Въведете пощенски код";
  else if (!POSTCODE_RE.test(v.postcode.trim())) e.postcode = "Пощенският код е 4 цифри";
  return e;
}

export function CheckoutForm() {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const subtotal = useCart(selectSubtotal);
  const clear = useCart((s) => s.clear);
  const hydrated = useCart((s) => s._hasHydrated);

  const [values, setValues] = useState<Values>(EMPTY);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const errors = validate(values);
  const errShown = (f: Field) => (touched[f] || attempted ? errors[f] : undefined);

  const delivery = deliveryCost(subtotal);
  const total = subtotal + delivery;

  // Pre-fill from the saved profile when the shopper is logged in.
  useEffect(() => {
    if (!isSupabaseConfiguredClient()) return;
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("default_address, full_name, phone")
        .eq("id", data.user.id)
        .single();
      const a = (profile?.default_address ?? null) as DeliveryAddress | null;
      const [fn = "", ...ln] = (profile?.full_name ?? "").split(" ");
      setValues((v) => ({
        ...v,
        first_name: v.first_name || a?.first_name || fn,
        last_name: v.last_name || a?.last_name || ln.join(" "),
        phone: v.phone || a?.phone || profile?.phone || "",
        email: v.email || data.user!.email || "",
        address: v.address || a?.address || "",
        city: v.city || a?.city || "",
        postcode: v.postcode || a?.postcode || "",
      }));
    });
  }, []);

  const set = (f: Field) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [f]: e.target.value }));
  const blur = (f: Field) => () => setTouched((t) => ({ ...t, [f]: true }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    setSubmitError(null);

    if (Object.keys(errors).length > 0) {
      const first = FIELD_ORDER.find((f) => errors[f]);
      if (first) document.getElementById(`f-${first}`)?.focus();
      return;
    }
    if (items.length === 0) return;

    setSubmitting(true);
    const id = newOrderId();
    const delivery_address: DeliveryAddress = {
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
      phone: cleanPhone(values.phone),
      email: values.email.trim() || undefined,
      address: values.address.trim(),
      city: values.city.trim(),
      postcode: values.postcode.trim(),
      note: values.note.trim() || undefined,
    };

    try {
      await createOrder({ id, items, total_bgn: total, delivery_address });
    } catch {
      setSubmitting(false);
      setSubmitError("Възникна грешка при изпращане на поръчката. Моля, опитайте отново.");
      return;
    }

    saveLastOrder({
      id,
      items,
      subtotal,
      delivery,
      total_bgn: total,
      delivery_address,
      created_at: new Date().toISOString(),
    });
    clear();
    router.push(`/porachka-uspeshna/${id}`);
  };

  // ---- loading / empty guards -------------------------------------------
  if (!hydrated) {
    return <div className="py-24 text-center text-sm text-ash">Зареждане…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-5 border border-hairline py-24 text-center">
        <ShoppingBag className="h-10 w-10 text-ash" strokeWidth={1} />
        <div>
          <p className="font-display text-2xl">Кошницата е празна</p>
          <p className="mt-2 text-sm text-ash">Добавете продукти, преди да поръчате.</p>
        </div>
        <Link href="/novo" className="btn-noir">
          Разгледай продуктите
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-10 lg:grid-cols-12 lg:gap-12">
      {/* fields */}
      <div className="order-2 space-y-10 lg:order-1 lg:col-span-7">
        <fieldset>
          <legend className="text-[0.8rem] uppercase tracking-widest2 font-semibold">
            Данни за доставка
          </legend>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <TextField id="f-first_name" label="Име" required value={values.first_name} onChange={set("first_name")} onBlur={blur("first_name")} error={errShown("first_name")} autoComplete="given-name" />
            <TextField id="f-last_name" label="Фамилия" required value={values.last_name} onChange={set("last_name")} onBlur={blur("last_name")} error={errShown("last_name")} autoComplete="family-name" />
            <TextField id="f-phone" label="Телефон" required type="tel" placeholder="0888 123 456" value={values.phone} onChange={set("phone")} onBlur={blur("phone")} error={errShown("phone")} autoComplete="tel" />
            <TextField id="f-email" label="Имейл (по избор)" type="email" placeholder="за потвърждение" value={values.email} onChange={set("email")} onBlur={blur("email")} error={errShown("email")} autoComplete="email" />
            <div className="sm:col-span-2">
              <TextField id="f-address" label="Адрес" required placeholder="ул. / бул., №, бл., ап." value={values.address} onChange={set("address")} onBlur={blur("address")} error={errShown("address")} autoComplete="street-address" />
            </div>
            <TextField id="f-city" label="Град" required value={values.city} onChange={set("city")} onBlur={blur("city")} error={errShown("city")} autoComplete="address-level2" />
            <TextField id="f-postcode" label="Пощенски код" required inputMode="numeric" maxLength={4} placeholder="1000" value={values.postcode} onChange={set("postcode")} onBlur={blur("postcode")} error={errShown("postcode")} autoComplete="postal-code" />
            <div className="sm:col-span-2">
              <label htmlFor="f-note" className="block text-[0.74rem] uppercase tracking-widest2 text-ash">
                Бележка към поръчката (по избор)
              </label>
              <textarea
                id="f-note"
                rows={3}
                value={values.note}
                onChange={set("note")}
                className="mt-2 w-full resize-none border border-hairline bg-paper px-3.5 py-3 text-sm focus:border-ink focus:outline-none"
              />
            </div>
          </div>
        </fieldset>

        {/* payment method — COD only */}
        <fieldset>
          <legend className="text-[0.8rem] uppercase tracking-widest2 font-semibold">Плащане</legend>
          <div className="mt-5 flex items-start gap-3 border border-ink bg-paper p-4">
            <span className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-ink">
              <span className="h-2 w-2 rounded-full bg-ink" />
            </span>
            <Banknote className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.4} />
            <div>
              <p className="text-sm font-medium">Наложен платеж</p>
              <p className="mt-1 text-[0.78rem] text-ash">
                Плащате в брой на куриера при доставка. Без онлайн плащане с карта.
              </p>
            </div>
          </div>
        </fieldset>

        {submitError && (
          <p role="alert" className="flex items-center gap-2 text-sm text-[#8a2b2b]">
            <AlertCircle className="h-4 w-4" strokeWidth={1.6} /> {submitError}
          </p>
        )}

        <button type="submit" disabled={submitting} className={cn("btn-noir w-full", submitting && "opacity-70")}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> Изпращане…
            </>
          ) : (
            "Потвърди поръчката"
          )}
        </button>
        <p className="-mt-4 text-center text-[0.72rem] text-ash">
          С потвърждаването приемате Общите условия. Ще се свържем с вас по телефона.
        </p>
      </div>

      {/* summary */}
      <aside className="order-1 lg:order-2 lg:col-span-5">
        <div className="lg:sticky lg:top-24">
          <OrderSummary items={items} subtotal={subtotal} delivery={delivery} total={total} />
        </div>
      </aside>
    </form>
  );
}
