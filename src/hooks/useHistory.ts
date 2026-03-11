// src/hooks/useHistory.ts
"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import type {
  HistoryOrderRow,
  HistoryResponse,
  HistoryFilters,
  PaymentStatus,
  OrderStatus,
  PaymentMethod,
} from "@/types/history";
import {
  toYmdLocal,
  startOfDay,
  startOfToday,
  startOfYesterday,
  rangeLastNDays,
  rangeThisMonth,
  safeMessage,
} from "@/lib/history-helpers";

const API_URL = "/api/admin/history";

export function useHistory() {
  // Filters state
  const [filters, setFilters] = useState<HistoryFilters>({
    q: "",
    table: "",
    paymentStatus: "all",
    orderStatus: "all",
    paymentMethod: "all",
    from: "",
    to: "",
    page: 1,
    pageSize: 20,
  });

  // Data state
  const [items, setItems] = useState<HistoryOrderRow[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Computed values
  const totalPages = useMemo(() => {
    if (filters.pageSize <= 0) return 1;
    return Math.max(1, Math.ceil(total / filters.pageSize));
  }, [total, filters.pageSize]);

  const summaryLabel = useMemo(() => {
    const parts: string[] = [];
    if (filters.q.trim()) parts.push(`Order: "${filters.q.trim()}"`);
    if (filters.table.trim()) parts.push(`Meja: ${filters.table.trim()}`);
    if (filters.paymentStatus !== "all")
      parts.push(`Pay: ${filters.paymentStatus}`);
    if (filters.orderStatus !== "all") parts.push(`Status: ${filters.orderStatus}`);
    if (filters.paymentMethod !== "all") {
      const pm = filters.paymentMethod;
      const display = pm === "online" ? "Online" : pm;
      parts.push(`Metode: ${display}`);
    }
    if (filters.from || filters.to)
      parts.push(`Tanggal: ${filters.from || "—"} s/d ${filters.to || "—"}`);
    return parts.length ? parts.join(" • ") : "Tanpa filter";
  }, [filters]);

  // Build API URL with query params
  const buildUrl = () => {
    const url = new URL(API_URL, window.location.origin);
    url.searchParams.set("page", String(filters.page));
    url.searchParams.set("pageSize", String(filters.pageSize));

    if (filters.q.trim()) url.searchParams.set("q", filters.q.trim());
    if (filters.table.trim()) url.searchParams.set("table", filters.table.trim());

    if (filters.paymentStatus !== "all") {
      url.searchParams.set("payment_status", filters.paymentStatus);
    }
    if (filters.orderStatus !== "all") {
      url.searchParams.set("order_status", filters.orderStatus);
    }
    if (filters.paymentMethod !== "all") {
      url.searchParams.set("payment_method", filters.paymentMethod);
    }

    if (filters.from) url.searchParams.set("from", filters.from);
    if (filters.to) url.searchParams.set("to", filters.to);

    return url.toString();
  };

  // Fetch data
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
      
      // Update page from response if provided
      if (typeof data.page === "number") {
        setFilters((prev) => ({ ...prev, page: data.page }));
      }
      if (typeof data.pageSize === "number") {
        setFilters((prev) => ({ ...prev, pageSize: data.pageSize }));
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    void fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce filters (except page/pageSize)
  useEffect(() => {
    const t = window.setTimeout(() => {
      setFilters((prev) => ({ ...prev, page: 1 }));
      void fetchHistory();
    }, 350);

    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.q,
    filters.table,
    filters.paymentStatus,
    filters.orderStatus,
    filters.paymentMethod,
    filters.from,
    filters.to,
  ]);

  // Page change (immediate fetch)
  useEffect(() => {
    void fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.pageSize]);

  // Quick filter functions
  const applyRange = (start: Date, end: Date) => {
    const f = toYmdLocal(startOfDay(start));
    const t = toYmdLocal(startOfDay(end));
    setFilters((prev) => ({ ...prev, from: f, to: t, page: 1 }));
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
    setFilters({
      q: "",
      table: "",
      paymentStatus: "all",
      orderStatus: "all",
      paymentMethod: "all",
      from: "",
      to: "",
      page: 1,
      pageSize: filters.pageSize, // Keep current pageSize
    });
  };

  // Update filter functions
  const updateFilter = <K extends keyof HistoryFilters>(
    key: K,
    value: HistoryFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return {
    // State
    filters,
    items,
    total,
    loading,
    totalPages,
    summaryLabel,

    // Actions
    updateFilter,
    setPage: (page: number) => updateFilter("page", page),
    setPageSize: (pageSize: number) =>
      setFilters((prev) => ({ ...prev, pageSize, page: 1 })),
    fetchHistory,
    quickToday,
    quickYesterday,
    quickLast7,
    quickThisMonth,
    resetFilters,
  };
}