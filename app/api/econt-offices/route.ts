import { NextResponse } from "next/server";
import type { EkontOffice } from "@/lib/types";

export const runtime = "nodejs";
// Caching is handled manually below (module-level cache + Cache-Control),
// so opt out of Next's static optimisation for this handler.
export const dynamic = "force-dynamic";

/**
 * Econt's public nomenclature service — no API key required. Returns every
 * office in the country (~1.8 MB), which is why we proxy it: the client gets
 * a trimmed ~140 KB payload and never talks to Econt directly (no CORS).
 */
const ECONT_OFFICES_URL =
  "https://ee.econt.com/services/Nomenclatures/NomenclaturesService.getOffices.json";

const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // offices change rarely — 12h is plenty

// Raw shapes we actually read from the Econt response.
interface EcontOfficeRaw {
  id: number;
  code: string;
  name: string;
  nameEn: string | null;
  isMPS: boolean; // mobile post station (roaming — not a fixed pickup point)
  isAPS: boolean; // Econtomat automatic locker
  address: {
    fullAddress: string | null;
    city: { name: string; nameEn: string | null; postCode: string | null } | null;
  } | null;
}

/** Trimmed office DTO sent to the browser; en fields let Latin-script queries match. */
export interface EkontOfficeDTO extends EkontOffice {
  name_en: string;
  city_en: string;
}

// Module-level cache: survives across requests within one server process and
// is served stale if Econt is down (same trade-offs as the rate-limit Maps in
// the order routes — per-instance, resets on cold start).
let cache: { offices: EkontOfficeDTO[]; fetchedAt: number } | null = null;

function toDTO(raw: EcontOfficeRaw): EkontOfficeDTO | null {
  const city = raw.address?.city;
  if (!city?.name || !raw.name) return null;
  return {
    id: raw.id,
    code: String(raw.code ?? ""),
    name: raw.name,
    name_en: raw.nameEn ?? "",
    city: city.name,
    city_en: city.nameEn ?? "",
    post_code: city.postCode ?? "",
    address: (raw.address?.fullAddress ?? "").trim(),
    is_aps: raw.isAPS || undefined,
  };
}

async function fetchOffices(): Promise<EkontOfficeDTO[]> {
  const res = await fetch(ECONT_OFFICES_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ countryCode: "BGR" }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`econt responded ${res.status}`);

  const data = (await res.json()) as { offices?: EcontOfficeRaw[] };
  const offices = (data.offices ?? [])
    // Mobile stations roam between villages on a schedule — not a stable
    // "deliver to this office" target, so they're excluded from the picker.
    .filter((o) => !o.isMPS)
    .map(toDTO)
    .filter((o): o is EkontOfficeDTO => o !== null)
    .sort((a, b) => a.city.localeCompare(b.city, "bg") || a.name.localeCompare(b.name, "bg"));

  if (offices.length === 0) throw new Error("econt returned no offices");
  return offices;
}

export async function GET() {
  const fresh = cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS;

  if (!fresh) {
    try {
      cache = { offices: await fetchOffices(), fetchedAt: Date.now() };
    } catch {
      // Serve the stale list if we have one; otherwise the picker shows a retry.
      if (!cache) {
        return NextResponse.json({ error: "econt_unavailable" }, { status: 502 });
      }
    }
  }

  return NextResponse.json(
    { offices: cache!.offices },
    {
      headers: {
        // Let browsers/CDN hold the payload too, so repeat checkouts don't
        // even hit this route.
        "Cache-Control": "public, max-age=3600, s-maxage=43200, stale-while-revalidate=86400",
      },
    },
  );
}
