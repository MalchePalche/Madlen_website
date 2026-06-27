"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface RefreshCtx {
  /** Re-fetch the server component (and thus Supabase) for this route. */
  refresh: () => void;
  /** True while the refresh transition is in flight — drives the spinners. */
  isRefreshing: boolean;
}

const Ctx = createContext<RefreshCtx | null>(null);

/** Read the refresh handler from the nearest PullToRefresh. No-op outside one. */
export function useAdminRefresh(): RefreshCtx {
  return useContext(Ctx) ?? { refresh: () => {}, isRefreshing: false };
}

const THRESHOLD = 72; // px of (damped) pull required to trigger a refresh
const MAX_PULL = 120; // cap so the gap never grows unbounded
const SPINNER_GAP = 56; // gap held open while the refresh runs

/**
 * Wraps an admin list page so that, on touch devices, pulling down from the
 * very top re-fetches the page's server data (Supabase). In a standalone PWA
 * there's no browser reload, so this — plus the header <RefreshButton/> — is
 * how admins get fresh data. Renders nothing extra on desktop.
 */
export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const refresh = useCallback(() => {
    startTransition(() => router.refresh());
  }, [router]);

  // `pull` drives the visual gap; the refs let the touch handlers read the
  // latest values without re-subscribing the listeners every render.
  const [pull, setPull] = useState(0);
  const pullRef = useRef(0);
  const startY = useRef<number | null>(null);
  const activeRef = useRef(false);
  const refreshingRef = useRef(isRefreshing);
  refreshingRef.current = isRefreshing;

  const setGap = useCallback((v: number) => {
    pullRef.current = v;
    setPull(v);
  }, []);

  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      if (refreshingRef.current || window.scrollY > 0 || e.touches.length !== 1) {
        startY.current = null;
        return;
      }
      startY.current = e.touches[0].clientY;
      activeRef.current = false;
    };

    const onMove = (e: TouchEvent) => {
      if (startY.current === null) return;
      const dy = e.touches[0].clientY - startY.current;
      // Cancel if the user scrolled away from the top or reversed direction.
      if (dy <= 0 || window.scrollY > 0) {
        if (activeRef.current) {
          activeRef.current = false;
          setGap(0);
        }
        if (window.scrollY > 0) startY.current = null;
        return;
      }
      activeRef.current = true;
      // Damp the pull so it feels elastic, and stop the page from scrolling.
      setGap(Math.min(MAX_PULL, dy * 0.5));
      if (e.cancelable) e.preventDefault();
    };

    const onEnd = () => {
      if (activeRef.current && pullRef.current >= THRESHOLD) refresh();
      startY.current = null;
      activeRef.current = false;
      setGap(0);
    };

    // touchmove must be non-passive so preventDefault can suppress native
    // scroll / the browser's own pull-to-refresh while we drive ours.
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [refresh, setGap]);

  const gap = isRefreshing ? SPINNER_GAP : pull;
  const progress = Math.min(1, pull / THRESHOLD);
  const settling = startY.current === null; // animate back when not actively dragging

  return (
    <Ctx.Provider value={{ refresh, isRefreshing }}>
      {/* Pull indicator — sits in the gap just under the mobile top bar. */}
      <div
        aria-hidden
        className="pointer-events-none fixed left-1/2 top-[calc(3.5rem+env(safe-area-inset-top))] z-20 lg:hidden"
        style={{
          transform: `translate(-50%, ${gap - 18}px)`,
          opacity: gap > 6 || isRefreshing ? 1 : 0,
          transition: settling ? "transform 0.2s ease, opacity 0.2s ease" : "none",
        }}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline bg-paper shadow-sm">
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.8} />
          ) : (
            <RefreshCw
              className={cn("h-4 w-4 transition-colors", progress >= 1 ? "text-ink" : "text-ash")}
              strokeWidth={1.8}
              style={{ transform: `rotate(${progress * 270}deg)` }}
            />
          )}
        </div>
      </div>

      {/* paddingTop (not transform) so descendant `fixed` dialogs stay anchored
          to the viewport rather than to a transformed ancestor. */}
      <div
        style={{
          paddingTop: gap,
          transition: settling ? "padding-top 0.2s ease" : "none",
        }}
      >
        {children}
      </div>
    </Ctx.Provider>
  );
}

/**
 * Fallback refresh control for the page header. Visible on mobile only — the
 * desktop sidebar/browser already offer a reload.
 */
export function RefreshButton({ className }: { className?: string }) {
  const { refresh, isRefreshing } = useAdminRefresh();
  return (
    <button
      type="button"
      onClick={refresh}
      disabled={isRefreshing}
      aria-label="Опресни"
      className={cn(
        "inline-flex h-11 w-11 shrink-0 items-center justify-center border border-hairline text-ash transition-colors hover:text-ink disabled:opacity-60 lg:hidden",
        className,
      )}
    >
      <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} strokeWidth={1.8} />
    </button>
  );
}
