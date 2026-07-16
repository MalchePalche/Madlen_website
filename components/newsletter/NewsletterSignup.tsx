"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { EMAIL_RE } from "@/lib/validation";
import { cn } from "@/lib/utils";

type Status = "idle" | "busy" | "ok" | "already";

interface NewsletterSignupProps {
  /** Recorded on the subscriber row, e.g. "footer" or "homepage". */
  source: string;
  className?: string;
}

/**
 * Newsletter (бюлетин) signup — collects an email into the
 * newsletter_subscribers table via /api/newsletter. Capture only for now;
 * actual mailings come later. Drop-in for the footer, homepage, etc.
 */
export function NewsletterSignup({ source, className }: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "busy") return;

    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setError("Невалиден имейл адрес");
      return;
    }

    setError(null);
    setStatus("busy");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, source }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        already?: boolean;
        error?: string;
      };
      if (!res.ok) {
        setStatus("idle");
        setError(data.error || "Възникна грешка. Моля, опитайте отново.");
        return;
      }
      setStatus(data.already ? "already" : "ok");
    } catch {
      setStatus("idle");
      setError("Възникна грешка. Моля, опитайте отново.");
    }
  };

  if (status === "ok" || status === "already") {
    return (
      <p className={cn("flex items-center gap-2 text-sm", className)}>
        <CheckCircle2 className="h-5 w-5 shrink-0" strokeWidth={1.5} />
        {status === "ok"
          ? "Благодарим! Вече сте абонирани за бюлетина."
          : "Този имейл вече е абониран за бюлетина."}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className={className}>
      <div className="flex max-w-md">
        <label htmlFor={`newsletter-email-${source}`} className="sr-only">
          Имейл за бюлетина
        </label>
        <input
          id={`newsletter-email-${source}`}
          type="email"
          autoComplete="email"
          placeholder="вашият@имейл.бг"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          aria-invalid={!!error}
          aria-describedby={error ? `newsletter-err-${source}` : undefined}
          className={cn(
            "min-w-0 flex-1 border bg-paper px-3.5 py-3 text-sm transition-colors focus:outline-none",
            error ? "border-[#8a2b2b] focus:border-[#8a2b2b]" : "border-hairline focus:border-ink",
          )}
        />
        <button
          type="submit"
          disabled={status === "busy"}
          className="btn-noir shrink-0 whitespace-nowrap px-5"
        >
          {status === "busy" ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
          ) : (
            "Абонирай ме"
          )}
        </button>
      </div>
      {error && (
        <p
          id={`newsletter-err-${source}`}
          role="alert"
          className="mt-1.5 flex items-center gap-1.5 text-[0.74rem] text-[#8a2b2b]"
        >
          <AlertCircle className="h-3.5 w-3.5" strokeWidth={1.6} /> {error}
        </p>
      )}
      <p className="mt-2 text-[0.7rem] text-ash">
        С абонирането се съгласявате с{" "}
        <Link href="/poveritelnost" className="underline hover:text-ink">
          политиката за поверителност
        </Link>
        .
      </p>
    </form>
  );
}
