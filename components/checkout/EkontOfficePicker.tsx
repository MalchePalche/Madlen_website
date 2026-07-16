"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2, MapPin, Search, X } from "lucide-react";
import type { EkontOffice } from "@/lib/types";
import type { MapOffice } from "./EkontOfficeMap";
import { cn } from "@/lib/utils";

// Leaflet reads `window` at import time — load the map client-side only, and
// only when the picker actually renders (keeps it out of the checkout bundle).
const EkontOfficeMap = dynamic(() => import("./EkontOfficeMap"), {
  ssr: false,
  loading: () => (
    <div aria-hidden className="h-56 w-full animate-pulse border border-hairline bg-mist sm:h-72" />
  ),
});

/**
 * Office DTO from /api/econt-offices — Latin fields are for search only,
 * lat/lng only feed the map; all are stripped before storing on the order.
 */
interface OfficeDTO extends EkontOffice {
  name_en: string;
  city_en: string;
  lat?: number;
  lng?: number;
}

const MAX_RESULTS = 60;

/** Case-insensitive haystack for one office (Cyrillic + Latin + code). */
function haystack(o: OfficeDTO): string {
  return `${o.city} ${o.city_en} ${o.name} ${o.name_en} ${o.address} ${o.code} ${o.post_code}`.toLowerCase();
}

interface EkontOfficePickerProps {
  value: EkontOffice | null;
  onChange: (office: EkontOffice | null) => void;
  error?: string;
}

/**
 * Searchable Econt office selector for checkout. Loads the trimmed office list
 * from /api/econt-offices on first render and filters it locally as the user
 * types (city, office name, address or office code — Cyrillic or Latin).
 */
export function EkontOfficePicker({ value, onChange, error }: EkontOfficePickerProps) {
  const [offices, setOffices] = useState<OfficeDTO[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  // Load once; `reload` bumps to retry after a failure.
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setLoadError(false);
    fetch("/api/econt-offices")
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json() as Promise<{ offices: OfficeDTO[] }>;
      })
      .then((data) => {
        if (active) setOffices(data.offices);
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, [reload]);

  const results = useMemo(() => {
    if (!offices) return [];
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return offices.slice(0, MAX_RESULTS);
    const matches: OfficeDTO[] = [];
    for (const o of offices) {
      const h = haystack(o);
      if (terms.every((t) => h.includes(t))) {
        matches.push(o);
        if (matches.length >= MAX_RESULTS) break;
      }
    }
    return matches;
  }, [offices, query]);

  // Sofia offices with coordinates — pinned on the map as a shortcut for the
  // capital; the search list below still covers the whole country.
  const sofiaOffices = useMemo(
    () =>
      (offices ?? []).filter(
        (o): o is OfficeDTO & MapOffice =>
          o.city === "София" && o.lat !== undefined && o.lng !== undefined,
      ),
    [offices],
  );

  // Keep the highlighted row valid and visible as the result set changes.
  useEffect(() => setHighlight(0), [query]);
  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${highlight}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [highlight]);

  const select = (o: OfficeDTO) => {
    // Strip the search/map-only fields before storing on the order.
    const { name_en: _n, city_en: _c, lat: _lat, lng: _lng, ...office } = o;
    onChange(office);
    setOpen(false);
    setQuery("");
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      select(results[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // ---- selected state --------------------------------------------------
  if (value) {
    return (
      <div className="flex items-start justify-between gap-3 border border-ink bg-paper p-4">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.4} />
          <div className="text-sm">
            <p className="font-medium">
              {value.is_aps ? "Еконтомат" : "Офис на Еконт"} {value.name}
            </p>
            <p className="mt-1 text-[0.78rem] leading-relaxed text-ash">
              {value.address}
              <br />
              {value.post_code} {value.city}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Премахни избрания офис"
          className="flex h-8 w-8 shrink-0 items-center justify-center text-ash transition-colors hover:text-ink"
        >
          <X className="h-4 w-4" strokeWidth={1.6} />
        </button>
      </div>
    );
  }

  // ---- load failure ------------------------------------------------------
  if (loadError) {
    return (
      <div className="border border-hairline bg-mist p-4 text-sm text-ash">
        Списъкът с офиси на Еконт не можа да се зареди.{" "}
        <button
          type="button"
          onClick={() => {
            setOffices(null);
            setReload((n) => n + 1);
          }}
          className="underline hover:text-ink"
        >
          Опитайте отново
        </button>
      </div>
    );
  }

  // ---- search state --------------------------------------------------------
  return (
    <div>
      <label
        htmlFor="f-econt-office"
        className="block text-[0.74rem] uppercase tracking-widest2 text-ash"
      >
        Офис на Еконт<span aria-hidden> *</span>
      </label>

      {/* Sofia map — pins select an office just like the list below */}
      {sofiaOffices.length > 0 && (
        <div className="mt-2">
          <EkontOfficeMap
            offices={sofiaOffices}
            onSelect={(o) => {
              // Look the DTO up by id — the map hands back its own type.
              const dto = offices?.find((x) => x.id === o.id);
              if (dto) select(dto);
            }}
          />
          <p className="mt-1.5 text-[0.7rem] text-ash">
            На картата: офиси в София — докоснете пин, за да изберете. За
            останалите населени места използвайте търсачката по-долу.
          </p>
        </div>
      )}

      <div className="relative mt-3">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ash"
          strokeWidth={1.6}
        />
        <input
          id="f-econt-office"
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls="econt-office-list"
          aria-invalid={!!error}
          aria-describedby={error ? "f-econt-office-err" : undefined}
          placeholder="Търсете по град, офис или адрес…"
          autoComplete="off"
          value={query}
          disabled={!offices}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          className={cn(
            "w-full border bg-paper py-3 pl-10 pr-3.5 text-sm transition-colors focus:outline-none disabled:text-ash",
            error ? "border-[#8a2b2b] focus:border-[#8a2b2b]" : "border-hairline focus:border-ink",
          )}
        />
        {!offices && !loadError && (
          <Loader2
            className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ash"
            strokeWidth={1.8}
          />
        )}
      </div>

      {open && offices && (
        <ul
          id="econt-office-list"
          role="listbox"
          ref={listRef}
          // preventDefault keeps focus in the input, so dragging the list's
          // scrollbar doesn't blur-close the dropdown.
          onMouseDown={(e) => e.preventDefault()}
          className="mt-1 max-h-64 overflow-y-auto border border-hairline bg-paper"
        >
          {results.length === 0 && (
            <li className="px-4 py-3 text-sm text-ash">Няма намерени офиси.</li>
          )}
          {results.map((o, i) => (
            <li
              key={o.id}
              data-index={i}
              role="option"
              aria-selected={i === highlight}
              // mousedown (not click) so selection wins over the input's blur
              onMouseDown={(e) => {
                e.preventDefault();
                select(o);
              }}
              onMouseEnter={() => setHighlight(i)}
              className={cn(
                "cursor-pointer border-b border-hairline px-4 py-2.5 last:border-b-0",
                i === highlight && "bg-mist",
              )}
            >
              <p className="text-sm">
                <span className="font-medium">{o.city}</span> — {o.name}
                {o.is_aps && (
                  <span className="ml-2 text-[0.62rem] uppercase tracking-widest2 text-ash">
                    Еконтомат
                  </span>
                )}
              </p>
              <p className="mt-0.5 truncate text-[0.74rem] text-ash">{o.address}</p>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p id="f-econt-office-err" className="mt-1.5 text-[0.74rem] text-[#8a2b2b]">
          {error}
        </p>
      )}
    </div>
  );
}
