"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Phone } from "lucide-react";
import { loadLastOrder, type StoredOrder } from "@/lib/orders";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { GuestSavePrompt } from "@/components/checkout/GuestSavePrompt";

export default function OrderSuccessPage({ params }: { params: { orderId: string } }) {
  // undefined = still reading sessionStorage; null = not found
  const [order, setOrder] = useState<StoredOrder | null | undefined>(undefined);

  useEffect(() => {
    setOrder(loadLastOrder(params.orderId));
  }, [params.orderId]);

  const shortId = params.orderId.slice(0, 8).toUpperCase();
  const a = order?.delivery_address;

  return (
    <div className="gutter mx-auto max-w-2xl py-16 text-center lg:py-24">
      <CheckoutSteps current={3} done className="mb-12 justify-center" />
      <CheckCircle2 className="mx-auto h-14 w-14 text-ink" strokeWidth={1} />
      <p className="eyebrow mt-6">Поръчката е приета</p>
      <h1 className="mt-3 font-display text-4xl lg:text-5xl">Благодарим за поръчката!</h1>

      <p className="mt-5 text-sm text-ash">
        Номер на поръчка:{" "}
        <span className="font-medium tracking-widest2 text-ink">#{shortId}</span>
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm text-ash">
        Ще се свържем с вас по телефона, за да потвърдим доставката. Плащането е при
        получаване (наложен платеж).
      </p>

      {order && (
        <div className="mt-10 space-y-6 text-left">
          <OrderSummary
            items={order.items}
            subtotal={order.subtotal}
            delivery={order.delivery}
            total={order.total_bgn}
          />

          {a && (
            <div className="bg-mist p-6 text-sm">
              <h2 className="text-[0.8rem] uppercase tracking-widest2 font-semibold">Доставка до</h2>
              <p className="mt-3 leading-relaxed">
                {a.first_name} {a.last_name}
                <br />
                {a.address}
                <br />
                {a.postcode} {a.city}
              </p>
              <p className="mt-3 flex items-center gap-2 text-ash">
                <Phone className="h-4 w-4" strokeWidth={1.5} /> {a.phone}
              </p>
              {a.email && <p className="mt-1 text-ash">{a.email}</p>}
              {a.note && <p className="mt-3 border-t border-hairline pt-3 text-ash">„{a.note}“</p>}
            </div>
          )}
        </div>
      )}

      {order === null && (
        <p className="mt-8 text-sm text-ash">
          Детайлите на поръчката не са налични на този екран, но поръчката е приета успешно.
        </p>
      )}

      {/* Guests: offer to save their details as an account (hidden once logged in) */}
      <GuestSavePrompt
        email={a?.email}
        name={a ? `${a.first_name} ${a.last_name}` : undefined}
        phone={a?.phone}
      />

      <Link href="/" className="btn-noir mt-10">
        Към началото
      </Link>
    </div>
  );
}
