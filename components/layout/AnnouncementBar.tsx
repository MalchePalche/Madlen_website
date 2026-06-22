import { BRAND } from "@/lib/config";

export function AnnouncementBar() {
  return (
    <div className="bg-noir text-paper">
      <p className="gutter py-2.5 text-center text-[0.62rem] uppercase tracking-widest2 font-medium">
        Безплатна доставка над {BRAND.freeShippingThreshold} €
        <span className="mx-2 opacity-40">·</span>
        Наложен платеж в цялата страна
        <span className="mx-2 opacity-40">·</span>
        Връщане до 30 дни
      </p>
    </div>
  );
}
