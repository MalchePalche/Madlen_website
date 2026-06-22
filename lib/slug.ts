/** Bulgarian Cyrillic → Latin transliteration (official streamlined system). */
const CYRILLIC_MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p",
  р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch",
  ш: "sh", щ: "sht", ъ: "a", ь: "y", ю: "yu", я: "ya",
};

/** Transliterate Cyrillic text to readable Latin, preserving spacing. */
export function transliterate(input: string): string {
  let out = "";
  for (const ch of input) {
    const lower = ch.toLowerCase();
    const mapped = CYRILLIC_MAP[lower];
    if (mapped === undefined) {
      out += ch; // already Latin, a digit, punctuation, etc.
    } else {
      // Preserve a leading capital (e.g. "Рокля" → "Roklya").
      out += ch === lower ? mapped : mapped.charAt(0).toUpperCase() + mapped.slice(1);
    }
  }
  return out;
}

/** URL-safe slug from any (incl. Cyrillic) string. */
export function slugify(input: string): string {
  return transliterate(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Slug for a freshly created product. Appends a short random suffix so two
 * products with the same name don't collide on the unique slug constraint.
 */
export function productSlug(name: string): string {
  const base = slugify(name) || "produkt";
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}
