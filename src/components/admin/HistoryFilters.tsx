// src/components/admin/HistoryFilters.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PaymentStatus, OrderStatus, PaymentMethod } from "@/types/history";

type Props = {
  q: string;
  setQ: (v: string) => void;
  table: string;
  setTable: (v: string) => void;
  paymentStatus: "all" | PaymentStatus;
  setPaymentStatus: (v: "all" | PaymentStatus) => void;
  orderStatus: "all" | OrderStatus;
  setOrderStatus: (v: "all" | OrderStatus) => void;
  paymentMethod: "all" | PaymentMethod;
  setPaymentMethod: (v: "all" | PaymentMethod) => void;
  from: string;
  setFrom: (v: string) => void;
  to: string;
  setTo: (v: string) => void;
  pageSize: number;
  setPageSize: (v: number) => void;
  setPage: (v: number) => void;
  total: number;
  summaryLabel: string;
  onQuickToday: () => void;
  onQuickYesterday: () => void;
  onQuickLast7: () => void;
  onQuickThisMonth: () => void;
  onReset: () => void;
};

export function HistoryFilters({
  q,
  setQ,
  table,
  setTable,
  paymentStatus,
  setPaymentStatus,
  orderStatus,
  setOrderStatus,
  paymentMethod,
  setPaymentMethod,
  from,
  setFrom,
  to,
  setTo,
  pageSize,
  setPageSize,
  setPage,
  total,
  summaryLabel,
  onQuickToday,
  onQuickYesterday,
  onQuickLast7,
  onQuickThisMonth,
  onReset,
}: Props) {
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
            onValueChange={(v) => setPaymentStatus(v as "all" | PaymentStatus)}
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

        {/* Payment method */}
        <div>
          <Select
            value={paymentMethod}
            onValueChange={(v) => setPaymentMethod(v as "all" | PaymentMethod)}
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
          <Button type="button" variant="outline" size="sm" onClick={onQuickToday}>
            Hari ini
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onQuickYesterday}
          >
            Kemarin
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onQuickLast7}>
            7 hari terakhir
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onQuickThisMonth}
          >
            Bulan ini
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onReset}>
            Reset
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-muted-foreground">Dari</div>
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
  );
}