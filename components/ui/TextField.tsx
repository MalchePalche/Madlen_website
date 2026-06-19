import { type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
}

/** Labelled text input with inline error state — shared by checkout + auth forms. */
export function TextField({ id, label, error, required, className, ...rest }: TextFieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-[0.74rem] uppercase tracking-widest2 text-ash">
        {label}
        {required && <span aria-hidden> *</span>}
      </label>
      <input
        id={id}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        className={cn(
          "mt-2 w-full border bg-paper px-3.5 py-3 text-sm transition-colors focus:outline-none",
          error ? "border-[#8a2b2b] focus:border-[#8a2b2b]" : "border-hairline focus:border-ink",
        )}
        {...rest}
      />
      {error && (
        <p id={`${id}-err`} className="mt-1.5 text-[0.74rem] text-[#8a2b2b]">
          {error}
        </p>
      )}
    </div>
  );
}
