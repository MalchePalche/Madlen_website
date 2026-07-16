"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { EkontOffice } from "@/lib/types";

/** An office that can be pinned — coordinates are guaranteed present. */
export interface MapOffice extends EkontOffice {
  lat: number;
  lng: number;
}

interface EkontOfficeMapProps {
  offices: MapOffice[];
  onSelect: (office: MapOffice) => void;
}

const SOFIA_CENTER: L.LatLngTuple = [42.6977, 23.3219];

// Site palette (globals.css): --ink-rgb / --paper-rgb.
const INK = "#0d0d0d";
const PAPER = "#faf9f7";

/**
 * Leaflet map of Econt offices (Sofia pins) for the checkout picker. Loaded
 * dynamically with ssr:false — Leaflet touches `window` at import time.
 * Clicking a pin selects the office exactly like picking it from the list.
 */
export default function EkontOfficeMap({ offices, onSelect }: EkontOfficeMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  // Let markers (bound once) always call the latest onSelect.
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const map = L.map(container, {
      center: SOFIA_CENTER,
      zoom: 11,
      // Wheel zoom hijacks page scrolling mid-form; +/- buttons and pinch
      // zoom still work.
      scrollWheelZoom: false,
      attributionControl: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;

    // One canvas renderer for all pins — far cheaper than 130+ DOM markers.
    const renderer = L.canvas({ padding: 0.4 });
    for (const office of offices) {
      L.circleMarker([office.lat, office.lng], {
        renderer,
        radius: 7,
        color: PAPER, // outline, so pins read against the tiles
        weight: 2,
        fillColor: INK,
        fillOpacity: 0.9,
      })
        .bindTooltip(
          `${office.is_aps ? "Еконтомат " : ""}${office.name}`,
          { direction: "top", offset: [0, -8] },
        )
        .on("click", () => onSelectRef.current(office))
        .addTo(map);
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // The office list is fetched once and stable for the picker's lifetime.
  }, [offices]);

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label="Карта с офиси на Еконт в София"
      className="h-56 w-full border border-hairline sm:h-72"
      // Leaflet panes default to z-index up to 700 — keep the whole map
      // below the site's sticky navbar/drawers.
      style={{ zIndex: 0, isolation: "isolate" }}
    />
  );
}
