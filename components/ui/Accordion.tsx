"use client";

import { useState, type ReactNode } from "react";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AccordionEntry {
  title: string;
  content: ReactNode;
}

/** Independent collapsible sections. `defaultOpen` opens one item initially. */
export function Accordion({
  items,
  defaultOpen = 0,
}: {
  items: AccordionEntry[];
  defaultOpen?: number | null;
}) {
  const [open, setOpen] = useState<Set<number>>(
    () => new Set(defaultOpen != null ? [defaultOpen] : []),
  );

  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  return (
    <div className="border-t border-hairline">
      {items.map((item, i) => {
        const isOpen = open.has(i);
        return (
          <div key={item.title} className="border-b border-hairline">
            <button
              type="button"
              onClick={() => toggle(i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 py-4 text-left text-[0.8rem] uppercase tracking-widest2 font-medium"
            >
              {item.title}
              {isOpen ? (
                <Minus className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              ) : (
                <Plus className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              )}
            </button>
            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-300 ease-editorial",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden">
                <div className="pb-5 text-sm leading-relaxed text-ash">{item.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
