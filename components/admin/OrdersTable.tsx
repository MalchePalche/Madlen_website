"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, ArrowUp, ArrowDown, PackageOpen } from "lucide-react";
import type { Order, OrderStatus } from "@/lib/types";
import { ORDER_STATUS_LABELS, ORDER_STATUSES, orderStatusRank } from "@/lib/orders";
import { formatEUR, cn } from "@/lib/utils";
import { StatusBadge } from "@/components/admin/StatusBadge";

type SortKey = "date" | "status";
type SortDir = "asc" | "desc";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("bg-BG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function itemCount(o: Order) {
  return o.items.reduce((n, i) => n + i.quantity, 0);
}

function customerName(o: Order) {
  const a = o.delivery_address;
  return `${a?.first_name ?? ""} ${a?.last_name ?? ""}`.trim() || "—";
}

export function OrdersTable({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const hasFilters = status !== "all" || from !== "" || to !== "";

  const rows = useMemo(() => {
    const fromTs = from ? new Date(`${from}T00:00:00`).getTime() : null;
    const toTs = to ? new Date(`${to}T23:59:59.999`).getTime() : null;

    const filtered = orders.filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      const t = new Date(o.created_at).getTime();
      if (fromTs !== null && t < fromTs) return false;
      if (toTs !== null && t > toTs) return false;
      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    return filtered.sort((a, b) => {
      const cmp =
        sortKey === "date"
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : orderStatusRank(a.status) - orderStatusRank(b.status);
      return cmp * dir;
    });
  }, [orders, status, from, to, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "date" ? "desc" : "asc");
    }
  };

  const clearFilters = () => {
    setStatus("all");
    setFrom("");
    setTo("");
  };

  const SortIcon = ({ active }: { active: boolean }) => {
    if (!active) return <ArrowUpDown className="h-3 w-3 opacity-40" strokeWidth={1.6} />;
    return sortDir === "asc" ? (
      <ArrowUp className="h-3 w-3" strokeWidth={2} />
    ) : (
      <ArrowDown className="h-3 w-3" strokeWidth={2} />
    );
  };

  const inputCls =
    "border border-hairline bg-paper px-3 py-2 text-sm focus:outline-none focus-visible:outline-2 focus-visible:outline-noir";
  const labelCls = "block text-[0.68rem] uppercase tracking-widest2 text-ash mb-1.5";

  return (
    <div>
      {/* ---- Filter bar ---- */}
      <div className="flex flex-wrap items-end gap-4 border border-hairline bg-mist/50 p-4">
        <div>
          <label htmlFor="f-status" className={labelCls}>
            Статус
          </label>
          <select
            id="f-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus | "all")}
            className={cn(inputCls, "min-w-[10rem]")}
          >
            <option value="all">Всички</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="f-from" className={labelCls}>
            От дата
          </label>
          <input
            id="f-from"
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => setFrom(e.target.value)}
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="f-to" className={labelCls}>
            До дата
          </label>
          <input
            id="f-to"
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => setTo(e.target.value)}
            className={inputCls}
          />
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="ml-auto text-[0.72rem] uppercase tracking-widest2 text-ash underline-offset-4 hover:text-ink hover:underline"
          >
            Изчисти филтрите
          </button>
        )}
      </div>

      <p className="mt-3 text-[0.72rem] uppercase tracking-widest2 text-ash">
        {rows.length} {rows.length === 1 ? "поръчка" : "поръчки"}
      </p>

      {/* ---- Table ---- */}
      <div className="mt-3 overflow-x-auto border border-hairline">
        <table className="w-full min-w-[52rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-hairline bg-mist text-left text-[0.68rem] uppercase tracking-widest2 text-ash">
              <th className="px-4 py-3 font-medium">№ поръчка</th>
              <th className="px-4 py-3 font-medium">
                <button
                  type="button"
                  onClick={() => toggleSort("date")}
                  className="inline-flex items-center gap-1.5 uppercase tracking-widest2 hover:text-ink"
                >
                  Дата <SortIcon active={sortKey === "date"} />
                </button>
              </th>
              <th className="px-4 py-3 font-medium">Клиент</th>
              <th className="px-4 py-3 font-medium">Телефон</th>
              <th className="px-4 py-3 text-center font-medium">Артикули</th>
              <th className="px-4 py-3 text-right font-medium">Сума</th>
              <th className="px-4 py-3 font-medium">
                <button
                  type="button"
                  onClick={() => toggleSort("status")}
                  className="inline-flex items-center gap-1.5 uppercase tracking-widest2 hover:text-ink"
                >
                  Статус <SortIcon active={sortKey === "status"} />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => {
              const href = `/admin/poruchki/${o.id}`;
              const go = () => router.push(href);
              return (
                <tr
                  key={o.id}
                  onClick={go}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      go();
                    }
                  }}
                  tabIndex={0}
                  role="link"
                  aria-label={`Поръчка ${o.id.slice(0, 8).toUpperCase()}`}
                  className="cursor-pointer border-b border-hairline last:border-0 transition-colors hover:bg-mist/60 focus:bg-mist/60 focus:outline-none"
                >
                  <td className="px-4 py-3 font-medium tracking-widest2 whitespace-nowrap">
                    #{o.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-ash tabular-nums">
                    {formatDateTime(o.created_at)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{customerName(o)}</td>
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                    {o.delivery_address?.phone ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums">{itemCount(o)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatEUR(o.total_bgn)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {rows.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <PackageOpen className="h-8 w-8 text-ash" strokeWidth={1} />
            <p className="text-sm text-ash">
              {orders.length === 0
                ? "Все още няма поръчки."
                : "Няма поръчки за избраните филтри."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
