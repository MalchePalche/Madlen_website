import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

/** Standard header + readable column for static content / legal pages. */
export function ContentPage({
  eyebrow,
  title,
  intro,
  children,
  wide = false,
}: {
  eyebrow: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  /** Use the full edge width (e.g. for tables) instead of a reading column. */
  wide?: boolean;
}) {
  return (
    <div className={cn("gutter mx-auto pb-24 pt-10 lg:pt-14", wide ? "max-w-edge" : "max-w-3xl")}>
      <Reveal>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 font-display text-4xl lg:text-5xl">{title}</h1>
        {intro && <p className="mt-5 max-w-2xl text-sm leading-relaxed text-ink/75">{intro}</p>}
      </Reveal>
      <div className="mt-12 space-y-10">{children}</div>
    </div>
  );
}

/** A titled content block with comfortably readable body text. */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-2xl">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink/80">{children}</div>
    </section>
  );
}

/** Bulleted list with the house hairline-marker style. */
export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3">
          <span aria-hidden className="mt-2 h-px w-3 shrink-0 bg-ink/40" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}
