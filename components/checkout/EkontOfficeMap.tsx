"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
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

// Site palette (globals.css): --ink-rgb / --paper-rgb / --noir-rgb.
const NOIR = "#000000"; // pin fill — the site's CTA/accent colour
const PAPER = "#faf9f7"; // pin outline + inner dot, so it reads against the tiles

// Teardrop pin (Google-Maps-style): a circular head tapering to a point at
// the bottom. iconAnchor sits at that point so the pin "stands" on its coords.
const PIN_WIDTH = 26;
const PIN_HEIGHT = 36;
const pinIcon = L.divIcon({
  className: "", // no leaflet-div-icon default box-shadow/background
  html: `
    <svg width="${PIN_WIDTH}" height="${PIN_HEIGHT}" viewBox="0 0 26 36" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M13 0C5.82 0 0 5.82 0 13c0 9.75 13 23 13 23s13-13.25 13-23C26 5.82 20.18 0 13 0z"
        fill="${NOIR}" stroke="${PAPER}" stroke-width="1.5"
      />
      <circle cx="13" cy="13" r="4.5" fill="${PAPER}" />
    </svg>
  `,
  iconSize: [PIN_WIDTH, PIN_HEIGHT],
  iconAnchor: [PIN_WIDTH / 2, PIN_HEIGHT],
  tooltipAnchor: [0, -PIN_HEIGHT + 4],
});

/** Custom cluster badge — a plain ink circle + count, matching the pin colours
 *  instead of the plugin's default green/yellow/orange gradient. */
function clusterIcon(cluster: L.MarkerCluster): L.DivIcon {
  const count = cluster.getChildCount();
  const size = count < 10 ? 34 : count < 100 ? 40 : 46;
  return L.divIcon({
    className: "",
    html: `
      <div style="
        display:flex;align-items:center;justify-content:center;
        width:${size}px;height:${size}px;border-radius:9999px;
        background:${NOIR};color:${PAPER};
        font:600 ${count < 100 ? 13 : 12}px/1 inherit;
        border:2px solid ${PAPER};
        box-shadow:0 1px 4px rgba(0,0,0,.35);
      ">${count}</div>
    `,
    iconSize: [size, size],
  });
}

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
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map);
    mapRef.current = map;

    // Clusters dense areas (central Sofia) into a number badge; spiderfies
    // the last few once you're zoomed all the way in on one spot.
    const clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      iconCreateFunction: clusterIcon,
    });
    for (const office of offices) {
      L.marker([office.lat, office.lng], { icon: pinIcon })
        .bindTooltip(`${office.is_aps ? "Еконтомат " : ""}${office.name}`, { direction: "top" })
        .on("click", () => onSelectRef.current(office))
        .addTo(clusterGroup);
    }
    clusterGroup.addTo(map);

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
