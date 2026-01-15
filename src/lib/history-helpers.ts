// src/lib/history-helpers.ts

import type { PaymentStatus, OrderStatus } from "@/types/history";

/** Extract message from unknown error response */
export function safeMessage(json: unknown, fallback: string): string {
  if (typeof json === "object" && json !== null && "message" in json) {
    return String((json as Record<string, unknown>).message);
  }
  return fallback;
}

/** Convert Date to YYYY-MM-DD local */
export function toYmdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Get start of day (00:00:00) */
export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Get start of today */
export function startOfToday(): Date {
  return startOfDay(new Date());
}

/** Get start of yesterday */
export function startOfYesterday(): Date {
  const d = startOfToday();
  d.setDate(d.getDate() - 1);
  return d;
}

/** Get date range for last N days */
export function rangeLastNDays(n: number): { start: Date; end: Date } {
  const end = startOfToday();
  const start = startOfToday();
  start.setDate(start.getDate() - (n - 1));
  return { start, end };
}

/** Get date range for current month */
export function rangeThisMonth(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: startOfDay(start), end: startOfDay(end) };
}

/** Format number as IDR currency */
export function formatRupiah(v: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(v);
}

/** Format ISO date to Indonesian datetime format */
export function formatDateTimeID(iso: string): string {
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

/** Get badge variant for payment status */
export function paymentBadgeVariant(
  s: PaymentStatus
): "default" | "secondary" | "destructive" | "outline" {
  if (s === "paid") return "secondary";
  if (s === "pending") return "outline";
  return "destructive";
}

/** Get badge variant for order status */
export function orderBadgeVariant(
  s: OrderStatus
): "default" | "secondary" | "destructive" | "outline" {
  if (s === "completed") return "secondary";
  if (s === "served") return "outline";
  return "secondary";
}