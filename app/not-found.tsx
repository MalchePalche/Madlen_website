import Link from "next/link";

export default function NotFound() {
  return (
    <section className="gutter mx-auto flex min-h-[60vh] max-w-edge flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow">Грешка 404</p>
      <h1 className="mt-4 font-display text-5xl lg:text-6xl">Страницата я няма</h1>
      <p className="mt-4 max-w-md text-sm text-ash">
        Възможно е тази секция още да е в процес на изработка или връзката да е остаряла.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-noir">
          Към началото
        </Link>
        <Link href="/novo" className="btn-outline">
          Нови продукти
        </Link>
      </div>
    </section>
  );
}
