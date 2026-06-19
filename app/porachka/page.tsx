import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const metadata: Metadata = {
  title: "Поръчка",
  description: "Завършете поръчката си — плащане при доставка (наложен платеж).",
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <div className="gutter mx-auto max-w-edge pb-24 pt-8 lg:pt-12">
      <p className="eyebrow">Плащане при доставка</p>
      <h1 className="mt-3 font-display text-4xl lg:text-5xl">Поръчка</h1>
      <div className="mt-10">
        <CheckoutForm />
      </div>
    </div>
  );
}
