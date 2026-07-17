import type { Metadata } from "next";
import Link from "next/link";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { ContentPage } from "@/components/content/ContentPage";
import { BRAND } from "@/lib/config";

export const runtime = "nodejs";
// Never cache: the outcome depends on the token and mutates subscriber state.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Отписване от бюлетина",
  robots: { index: false, follow: false },
};

type Status = "ok" | "already" | "invalid" | "error";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Set unsubscribed_at for the subscriber matching `token`. Idempotent. */
async function unsubscribe(token: string): Promise<Status> {
  if (!token || !UUID_RE.test(token)) return "invalid";

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return "error";

  const admin = createServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: sub, error } = await admin
    .from("newsletter_subscribers")
    .select("id, unsubscribed_at")
    .eq("unsubscribe_token", token)
    .maybeSingle();

  if (error) return "error";
  if (!sub) return "invalid";
  if (sub.unsubscribed_at) return "already";

  const { error: upErr } = await admin
    .from("newsletter_subscribers")
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("unsubscribe_token", token);

  return upErr ? "error" : "ok";
}

const COPY: Record<Status, { title: string; body: string }> = {
  ok: {
    title: "Отписахте се успешно",
    body: "Вече няма да получавате имейли с новини и промоции от нас. Съжаляваме, че си тръгвате!",
  },
  already: {
    title: "Вече сте отписани",
    body: "Този имейл адрес вече не е абониран за бюлетина ни. Не е необходимо действие.",
  },
  invalid: {
    title: "Невалидна връзка",
    body: "Връзката за отписване е невалидна или изтекла. Ако продължавате да получавате имейли, пишете ни и ще ви отпишем ръчно.",
  },
  error: {
    title: "Възникна грешка",
    body: "Не успяхме да обработим заявката в момента. Моля, опитайте отново по-късно или се свържете с нас.",
  },
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: { token?: string | string[] };
}) {
  const token =
    typeof searchParams.token === "string"
      ? searchParams.token
      : Array.isArray(searchParams.token)
        ? searchParams.token[0]
        : "";

  const status = await unsubscribe(token);
  const { title, body } = COPY[status];

  return (
    <ContentPage eyebrow="Бюлетин" title={title} intro={body}>
      <p className="text-sm leading-relaxed text-ink/80">
        Имате въпрос? Пишете ни на{" "}
        <a href={`mailto:${BRAND.email}`} className="underline hover:text-ink">
          {BRAND.email}
        </a>
        .
      </p>
      <Link
        href="/"
        className="inline-block bg-ink px-6 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-paper"
      >
        Към началната страница
      </Link>
    </ContentPage>
  );
}
