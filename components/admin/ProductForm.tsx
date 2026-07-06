"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, X, Plus, Upload, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { TextField } from "@/components/ui/TextField";
import { CATEGORIES, GENDER_OPTIONS, SIZE_OPTIONS } from "@/lib/config";
import { productSlug } from "@/lib/slug";
import { transliterate } from "@/lib/slug";
import { cn } from "@/lib/utils";
import type { Gender, Product, ProductColor } from "@/lib/types";

const LABEL = "block text-[0.74rem] uppercase tracking-widest2 text-ash";

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const isEdit = Boolean(product);

  const [nameBg, setNameBg] = useState(product?.name_bg ?? "");
  const [price, setPrice] = useState(product ? String(product.price_bgn) : "");
  const [compareAt, setCompareAt] = useState(
    product?.compare_at_bgn ? String(product.compare_at_bgn) : "",
  );
  const [gender, setGender] = useState<Gender>(product?.gender ?? "female");
  const [category, setCategory] = useState(product?.category ?? CATEGORIES[0].slug);
  const [description, setDescription] = useState(product?.description_bg ?? "");
  const [material, setMaterial] = useState(product?.material_bg ?? "");
  const [sizes, setSizes] = useState<string[]>(product?.sizes ?? []);
  const [oosSizes, setOosSizes] = useState<string[]>(product?.out_of_stock_sizes ?? []);
  const [colors, setColors] = useState<ProductColor[]>(product?.colors ?? []);
  const [isNew, setIsNew] = useState(product?.is_new ?? false);
  const [stock, setStock] = useState(product ? String(product.stock) : "0");
  const [images, setImages] = useState<string[]>(product?.images ?? []);

  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceNum = Number(price);
  const compareNum = compareAt.trim() ? Number(compareAt) : null;
  const nameError = attempted && !nameBg.trim() ? "Въведете име" : undefined;
  const priceError =
    attempted && (!Number.isFinite(priceNum) || priceNum <= 0) ? "Невалидна цена" : undefined;
  // Optional; when set it must be a valid number higher than the sale price so
  // the strike-through original reads correctly on the card/PDP.
  const compareError =
    attempted &&
    compareNum !== null &&
    (!Number.isFinite(compareNum) || compareNum <= priceNum)
      ? "Трябва да е по-висока от цената"
      : undefined;
  const imagesError = attempted && images.length === 0 ? "Добавете поне една снимка" : undefined;

  const toggleSize = (s: string) => {
    setSizes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
    // Removing a size must also clear it from the out-of-stock subset.
    if (sizes.includes(s)) setOosSizes((prev) => prev.filter((x) => x !== s));
  };

  const toggleOos = (s: string) =>
    setOosSizes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const addColor = () => setColors((prev) => [...prev, { name: "", hex: "#000000" }]);
  const updateColor = (i: number, patch: Partial<ProductColor>) =>
    setColors((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const removeColor = (i: number) => setColors((prev) => prev.filter((_, idx) => idx !== i));

  const onFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    setError(null);
    const supabase = createClient();
    for (const file of Array.from(fileList)) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("products")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) {
        setError("Грешка при качване на снимка. Опитайте отново.");
        continue;
      }
      const { data } = supabase.storage.from("products").getPublicUrl(path);
      setImages((prev) => [...prev, data.publicUrl]);
    }
    setUploading(false);
  };

  const removeImage = (url: string) => setImages((prev) => prev.filter((u) => u !== url));
  const makePrimary = (url: string) =>
    setImages((prev) => [url, ...prev.filter((u) => u !== url)]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    setError(null);

    const compareInvalid =
      compareNum !== null && (!Number.isFinite(compareNum) || compareNum <= priceNum);
    if (
      !nameBg.trim() ||
      !Number.isFinite(priceNum) ||
      priceNum <= 0 ||
      compareInvalid ||
      images.length === 0
    ) {
      return;
    }

    setBusy(true);
    const supabase = createClient();

    const payload = {
      name_bg: nameBg.trim(),
      name_en: transliterate(nameBg.trim()),
      price_bgn: priceNum,
      compare_at_bgn: compareNum,
      category,
      gender,
      description_bg: description.trim() || null,
      material_bg: material.trim() || null,
      sizes,
      // keep the out-of-stock set a strict subset of the offered sizes
      out_of_stock_sizes: oosSizes.filter((s) => sizes.includes(s)),
      // drop half-filled colour rows
      colors: colors.filter((c) => c.name.trim()).map((c) => ({ name: c.name.trim(), hex: c.hex })),
      is_new: isNew,
      stock: Math.max(0, Math.trunc(Number(stock) || 0)),
      images,
    };

    const { error: dbErr } = isEdit
      ? await supabase.from("products").update(payload).eq("id", product!.id)
      : await supabase.from("products").insert({ ...payload, slug: productSlug(nameBg) });

    setBusy(false);
    if (dbErr) {
      setError(`Грешка при запазване: ${dbErr.message}`);
      return;
    }
    router.push("/admin/prodakti");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-2xl space-y-7">
      <TextField
        id="p-name"
        label="Име на продукта"
        required
        value={nameBg}
        onChange={(e) => setNameBg(e.target.value)}
        error={nameError}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="p-price"
          label="Цена (€)"
          type="number"
          min="0"
          step="0.01"
          required
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          error={priceError}
        />
        <TextField
          id="p-compare"
          label="Оригинална цена преди намаление (€)"
          type="number"
          min="0"
          step="0.01"
          value={compareAt}
          onChange={(e) => setCompareAt(e.target.value)}
          error={compareError}
          placeholder="напр. 79.00"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="p-stock"
          label="Наличност (бр.)"
          type="number"
          min="0"
          step="1"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="p-gender" className={LABEL}>
            Пол
          </label>
          <select
            id="p-gender"
            value={gender}
            onChange={(e) => setGender(e.target.value as Gender)}
            className="mt-2 w-full border border-hairline bg-paper px-3.5 py-3 text-sm transition-colors focus:border-ink focus:outline-none"
          >
            {GENDER_OPTIONS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="p-category" className={LABEL}>
            Категория
          </label>
          <select
            id="p-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-2 w-full border border-hairline bg-paper px-3.5 py-3 text-sm transition-colors focus:border-ink focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="p-desc" className={LABEL}>
          Описание
        </label>
        <textarea
          id="p-desc"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-2 w-full border border-hairline bg-paper px-3.5 py-3 text-sm transition-colors focus:border-ink focus:outline-none"
        />
      </div>

      <TextField
        id="p-material"
        label="Материал"
        value={material}
        onChange={(e) => setMaterial(e.target.value)}
        placeholder="напр. 100% памук"
      />

      {/* Sizes */}
      <div>
        <span className={LABEL}>Размери</span>
        <div className="mt-2 grid grid-cols-5 gap-2 sm:flex sm:flex-wrap">
          {SIZE_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleSize(s)}
              className={cn(
                "flex min-h-[44px] items-center justify-center border px-2 text-sm transition-colors sm:min-w-[3.25rem] sm:px-4",
                sizes.includes(s)
                  ? "border-noir bg-noir text-paper"
                  : "border-hairline hover:border-ink",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Out-of-stock sizes — a subset of the sizes selected above */}
      <div>
        <span className={LABEL}>Изчерпани размери</span>
        {sizes.length === 0 ? (
          <p className="mt-2 text-[0.78rem] text-ash">Първо изберете размери по-горе.</p>
        ) : (
          <>
            <div className="mt-2 grid grid-cols-5 gap-2 sm:flex sm:flex-wrap">
              {SIZE_OPTIONS.filter((s) => sizes.includes(s)).map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={oosSizes.includes(s)}
                  onClick={() => toggleOos(s)}
                  className={cn(
                    "flex min-h-[44px] items-center justify-center border px-2 text-sm transition-colors sm:min-w-[3.25rem] sm:px-4",
                    oosSizes.includes(s)
                      ? "border-noir bg-noir text-paper line-through"
                      : "border-hairline hover:border-ink",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[0.78rem] text-ash">
              Маркираните размери се показват като недостъпни на страницата на продукта.
            </p>
          </>
        )}
      </div>

      {/* Colors */}
      <div>
        <span className={LABEL}>Цветове</span>
        <div className="mt-2 space-y-2">
          {colors.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="color"
                value={c.hex}
                onChange={(e) => updateColor(i, { hex: e.target.value })}
                aria-label="Цвят"
                className="h-11 w-12 shrink-0 cursor-pointer border border-hairline bg-paper p-1"
              />
              <input
                type="text"
                value={c.name}
                onChange={(e) => updateColor(i, { name: e.target.value })}
                placeholder="Име на цвета (напр. Черно)"
                className="w-full border border-hairline bg-paper px-3.5 py-3 text-sm transition-colors focus:border-ink focus:outline-none"
              />
              <button
                type="button"
                onClick={() => removeColor(i)}
                aria-label="Премахни цвят"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center border border-hairline text-ash transition-colors hover:text-[#8a2b2b]"
              >
                <X className="h-4 w-4" strokeWidth={1.6} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addColor}
            className="inline-flex items-center gap-2 text-[0.78rem] uppercase tracking-widest2 text-ash transition-colors hover:text-ink"
          >
            <Plus className="h-4 w-4" strokeWidth={1.6} /> Добави цвят
          </button>
        </div>
      </div>

      {/* Images */}
      <div>
        <span className={LABEL}>Снимки</span>
        {images.length > 0 && (
          <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {images.map((url, i) => (
              <div key={url} className="group relative aspect-[3/4] overflow-hidden border border-hairline bg-mist">
                <Image src={url} alt="" fill sizes="120px" className="object-cover" />
                {i === 0 && (
                  <span className="absolute left-1 top-1 bg-noir px-1.5 py-0.5 text-[0.55rem] uppercase tracking-widest2 text-paper">
                    Основна
                  </span>
                )}
                {/* Actions are always visible on touch (no hover); fade-on-hover on desktop. */}
                <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-noir/50 p-1.5 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
                  {i !== 0 && (
                    <button
                      type="button"
                      onClick={() => makePrimary(url)}
                      aria-label="Направи основна"
                      className="inline-flex h-9 w-9 items-center justify-center bg-paper text-ink lg:h-7 lg:w-7"
                    >
                      <Star className="h-4 w-4" strokeWidth={1.6} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(url)}
                    aria-label="Премахни снимка"
                    className="ml-auto inline-flex h-9 w-9 items-center justify-center bg-paper text-[#8a2b2b] lg:h-7 lg:w-7"
                  >
                    <X className="h-4 w-4" strokeWidth={1.6} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <label
          className={cn(
            "mt-3 flex min-h-[7rem] cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-hairline px-4 py-8 text-sm text-ash transition-colors hover:border-ink hover:text-ink active:border-ink",
            uploading && "pointer-events-none opacity-60",
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" /> Качване…
            </>
          ) : (
            <>
              <Upload className="h-6 w-6" strokeWidth={1.4} /> Качи снимки
            </>
          )}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              onFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        {imagesError && <p className="mt-1.5 text-[0.74rem] text-[#8a2b2b]">{imagesError}</p>}
      </div>

      {/* is_new toggle */}
      <label className="flex cursor-pointer items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={isNew}
          onClick={() => setIsNew((v) => !v)}
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full transition-colors",
            isNew ? "bg-noir" : "bg-ash/40",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full bg-paper transition-transform",
              isNew ? "translate-x-[1.375rem]" : "translate-x-0.5",
            )}
          />
        </button>
        <span className="text-sm">Маркирай като „Ново“</span>
      </label>

      {error && (
        <p role="alert" className="flex items-center gap-2 text-sm text-[#8a2b2b]">
          <AlertCircle className="h-4 w-4" strokeWidth={1.6} /> {error}
        </p>
      )}

      <div className="flex gap-3 border-t border-hairline pt-6">
        <Link href="/admin/prodakti" className="btn-outline">
          Отказ
        </Link>
        <button type="submit" disabled={busy || uploading} className={cn("btn-noir", (busy || uploading) && "opacity-70")}>
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isEdit ? (
            "Запази промените"
          ) : (
            "Добави продукт"
          )}
        </button>
      </div>
    </form>
  );
}
