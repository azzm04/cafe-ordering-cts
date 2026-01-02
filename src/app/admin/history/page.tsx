"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** =========================
 *  CONFIG
 *  ========================= */
const API_URL = "/api/admin/history";

/** =========================
 *  TYPES
 *  ========================= */
type PaymentStatus = "pending" | "paid" | "failed" | "expired";
type OrderStatus = "received" | "served" | "completed";
type PaymentMethod = "cash" | "qris";

type HistoryOrderRow = {
  id: string;
  order_number: string;
  created_at: string;
  completed_at: string | null;
  total_amount: number;
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  tables: { table_number: number } | null;
};

type HistoryResponse = {
  items: HistoryOrderRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages?: number;
  message?: string;
};

/** =========================
 *  HELPERS
 *  ========================= */
function safeMessage(json: unknown, fallback: string) {
  if (typeof json === "object" && json !== null && "message" in json) {
    return String((json as Record<string, unknown>).message);
  }
  return fallback;
}

function toYmdLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfToday() {
  return startOfDay(new Date());
}

function startOfYesterday() {
  const d = startOfToday();
  d.setDate(d.getDate() - 1);
  return d;
}

function rangeLastNDays(n: number) {
  const end = startOfToday();
  const start = startOfToday();
  start.setDate(start.getDate() - (n - 1));
  return { start, end };
}

function rangeThisMonth() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: startOfDay(start), end: startOfDay(end) };
}

function formatRupiah(v: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(v);
}

function formatDateTimeID(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function paymentBadgeVariant(s: PaymentStatus) {
  if (s === "paid") return "secondary";
  if (s === "pending") return "outline";
  return "destructive";
}

function orderBadgeVariant(s: OrderStatus) {
  if (s === "completed") return "secondary";
  if (s === "served") return "outline";
  return "secondary";
}

/** =========================
 *  PAGE
 *  ========================= */
export default function AdminHistoryPage() {
  // Filters
  const [q, setQ] = useState<string>("");
  const [table, setTable] = useState<string>("");

  const [paymentStatus, setPaymentStatus] = useState<"all" | PaymentStatus>(
    "all"
  );
  const [orderStatus, setOrderStatus] = useState<"all" | OrderStatus>("all");

  // ✅ method jadi dropdown 3 opsi
  const [paymentMethod, setPaymentMethod] = useState<"all" | PaymentMethod>(
    "all"
  );

  // Date range (YYYY-MM-DD)
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  // Data
  const [items, setItems] = useState<HistoryOrderRow[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  const [loading, setLoading] = useState<boolean>(true);

  const totalPages = useMemo(() => {
    if (pageSize <= 0) return 1;
    return Math.max(1, Math.ceil(total / pageSize));
  }, [total, pageSize]);

  const summaryLabel = useMemo(() => {
    const parts: string[] = [];
    if (q.trim()) parts.push(`Order: "${q.trim()}"`);
    if (table.trim()) parts.push(`Meja: ${table.trim()}`);
    if (paymentStatus !== "all") parts.push(`Pay: ${paymentStatus}`);
    if (orderStatus !== "all") parts.push(`Status: ${orderStatus}`);
    if (paymentMethod !== "all") parts.push(`Metode: ${paymentMethod}`);
    if (from || to) parts.push(`Tanggal: ${from || "—"} s/d ${to || "—"}`);
    return parts.length ? parts.join(" • ") : "Tanpa filter";
  }, [q, table, paymentStatus, orderStatus, paymentMethod, from, to]);

  const buildUrl = () => {
    const url = new URL(API_URL, window.location.origin);
    url.searchParams.set("page", String(page));
    url.searchParams.set("pageSize", String(pageSize));

    if (q.trim()) url.searchParams.set("q", q.trim());
    if (table.trim()) url.searchParams.set("table", table.trim());

    if (paymentStatus !== "all") {
      url.searchParams.set("payment_status", paymentStatus);
    }
    if (orderStatus !== "all") {
      url.searchParams.set("order_status", orderStatus);
    }

    // ✅ FIX: param harus "payment_method", bukan "method"
    if (paymentMethod !== "all") {
      url.searchParams.set("payment_method", paymentMethod);
    }

    if (from) url.searchParams.set("from", from);
    if (to) url.searchParams.set("to", to);

    return url.toString();
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(buildUrl(), { cache: "no-store" });

      const contentType = res.headers.get("content-type") || "";
      const raw = await res.text();

      if (!contentType.includes("application/json")) {
        const hint =
          raw.includes("<!DOCTYPE") || raw.includes("<html")
            ? "Server mengembalikan HTML (kemungkinan redirect ke login / route tidak ditemukan)."
            : "Server mengembalikan response non-JSON.";

        throw new Error(
          `Response bukan JSON. ${hint}\nCek endpoint: ${API_URL}\nHTTP ${res.status}`
        );
      }

      const json: unknown = raw ? JSON.parse(raw) : null;

      if (!res.ok) throw new Error(safeMessage(json, "Gagal load history"));

      const data = json as HistoryResponse;

      setItems(Array.isArray(data.items) ? data.items : []);
      setTotal(typeof data.total === "number" ? data.total : 0);
      setPage(typeof data.page === "number" ? data.page : page);
      setPageSize(typeof data.pageSize === "number" ? data.pageSize : pageSize);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // initial load
  useEffect(() => {
    void fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // debounce filters
  useEffect(() => {
    const t = window.setTimeout(() => {
      setPage(1);
      void fetchHistory();
    }, 350);

    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, table, paymentStatus, orderStatus, paymentMethod, from, to]);

  // page change
  useEffect(() => {
    void fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  /** Quick filters */
  const applyRange = (start: Date, end: Date) => {
    const f = toYmdLocal(startOfDay(start));
    const t = toYmdLocal(startOfDay(end));
    setFrom(f);
    setTo(t);
    setPage(1);
  };

  const quickToday = () => applyRange(startOfToday(), startOfToday());
  const quickYesterday = () =>
    applyRange(startOfYesterday(), startOfYesterday());
  const quickLast7 = () => {
    const { start, end } = rangeLastNDays(7);
    applyRange(start, end);
  };
  const quickThisMonth = () => {
    const { start, end } = rangeThisMonth();
    applyRange(start, end);
  };

  const resetFilters = () => {
    setQ("");
    setTable("");
    setPaymentStatus("all");
    setOrderStatus("all");
    setPaymentMethod("all");
    setFrom("");
    setTo("");
    setPage(1);
  };

  /** Date input handlers (auto swap kalau kebalik) */
  const onChangeFrom = (v: string) => {
    setFrom(v);
    setPage(1);
    if (to && v && v > to) setTo(v);
  };
  const onChangeTo = (v: string) => {
    setTo(v);
    setPage(1);
    if (from && v && v < from) setFrom(v);
  };

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">History Pesanan</h1>
          <p className="text-sm opacity-70">
            Cari & lihat order lama, reprint, cek status.
          </p>
        </div>

        <div className="flex gap-2">
          <Link href="/admin">
            <Button variant="outline">Kembali</Button>
          </Link>
          <Button
            variant="secondary"
            onClick={() => void fetchHistory()}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          {/* Order number */}
          <div className="md:col-span-2">
            <Input
              placeholder="Cari order number..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {/* Table */}
          <div>
            <Input
              placeholder="Meja (cth: 4)"
              value={table}
              onChange={(e) => setTable(e.target.value)}
              inputMode="numeric"
            />
          </div>

          {/* Payment status */}
          <div>
            <Select
              value={paymentStatus}
              onValueChange={(v) =>
                setPaymentStatus(v as "all" | PaymentStatus)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Payment</SelectItem>
                <SelectItem value="pending">pending</SelectItem>
                <SelectItem value="paid">paid</SelectItem>
                <SelectItem value="failed">failed</SelectItem>
                <SelectItem value="expired">expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Order status */}
          <div>
            <Select
              value={orderStatus}
              onValueChange={(v) => setOrderStatus(v as "all" | OrderStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="received">received</SelectItem>
                <SelectItem value="served">served</SelectItem>
                <SelectItem value="completed">completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ✅ Payment method dropdown */}
          <div>
            <Select
              value={paymentMethod}
              onValueChange={(v) =>
                setPaymentMethod(v as "all" | PaymentMethod)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Metode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Pembayaran</SelectItem>
                <SelectItem value="cash">cash</SelectItem>
                <SelectItem value="qris">qris</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Date range + quick filters */}
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">
            Filter:{" "}
            <span className="font-semibold text-foreground">{summaryLabel}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={quickToday}>
              Hari ini
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={quickYesterday}
            >
              Kemarin
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={quickLast7}>
              7 hari terakhir
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={quickThisMonth}
            >
              Bulan ini
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
              Reset
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-muted-foreground">
                Dari
              </div>
              <Input
                type="date"
                value={from}
                onChange={(e) => onChangeFrom(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <div className="text-xs font-semibold text-muted-foreground">
                Sampai
              </div>
              <Input
                type="date"
                value={to}
                onChange={(e) => onChangeTo(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <div className="text-xs font-semibold text-muted-foreground">
                Per halaman
              </div>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  const n = Number(v);
                  setPageSize(Number.isFinite(n) ? n : 20);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Page size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm opacity-70">
              Total: <span className="font-semibold">{total}</span> order
            </div>
          </div>
        </div>
      </Card>

      {/* List */}
      <Card className="p-4 space-y-3">
        {loading ? (
          <p className="text-sm opacity-70">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-sm opacity-70">Tidak ada data.</p>
        ) : (
          <div className="space-y-3">
            {items.map((o) => (
              <Card key={o.id} className="p-4 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="font-semibold">{o.order_number}</div>
                    <div className="text-xs opacity-70">
                      {formatDateTimeID(o.created_at)}
                      {o.completed_at
                        ? ` • selesai ${formatDateTimeID(o.completed_at)}`
                        : ""}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 items-center">
                    <Badge variant="secondary">
                      Meja {o.tables?.table_number ?? "-"}
                    </Badge>
                    <Badge variant={paymentBadgeVariant(o.payment_status)}>
                      {o.payment_status}
                    </Badge>
                    <Badge variant={orderBadgeVariant(o.order_status)}>
                      {o.order_status}
                    </Badge>
                    <Badge variant="outline">
                      {o.payment_method ?? "midtrans"}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm">
                    Total:{" "}
                    <span className="font-semibold">
                      {formatRupiah(o.total_amount)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-end">
                    <Link href={`/nota/${o.order_number}`} target="_blank">
                      <Button variant="outline" size="sm">
                        Lihat Nota
                      </Button>
                    </Link>
                    <Link
                      href={`/admin/print/kitchen/${o.order_number}`}
                      target="_blank"
                    >
                      <Button variant="secondary" size="sm">
                        Reprint Dapur
                      </Button>
                    </Link>
                    <Link
                      href={`/admin/print/bar/${o.order_number}`}
                      target="_blank"
                    >
                      <Button variant="secondary" size="sm">
                        Reprint Bar
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between pt-3">
          <div className="text-xs opacity-70">
            Page {page} / {totalPages}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={loading || page <= 1}
            >
              Prev
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={loading || page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </main>
  );
}
