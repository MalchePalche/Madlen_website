"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useUser } from "@/components/auth/AuthProvider";

export function SignOutButton() {
  const { signOut } = useUser();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    setBusy(true);
    await signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="inline-flex items-center gap-2 text-[0.78rem] uppercase tracking-widest2 text-ash transition-colors hover:text-ink"
    >
      <LogOut className="h-4 w-4" strokeWidth={1.5} />
      {busy ? "Излизане…" : "Изход"}
    </button>
  );
}
