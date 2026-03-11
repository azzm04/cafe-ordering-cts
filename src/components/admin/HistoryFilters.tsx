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
import { Search, Filter, CalendarDays, RotateCcw } from "lucide-react";
import type {
  PaymentStatus,
  OrderStatus,
  PaymentMethod,
} from "@/types/history";

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
    <Card className="bg-white/95 dark:bg-card/95 backdrop-blur-xl border border-border/60 shadow-sm rounded-2xl overflow-hidden">
      {/* Header Filter */}
      <div className="bg-muted/30 px-4 sm:px-6 py-3 sm:py-4 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="font-semibold text-sm">Filter Pencarian</span>
        </div>
        <div className="text-xs text-muted-foreground">
          Aktif:{" "}
          <span className="font-semibold text-foreground bg-muted px-2 py-1 rounded-md">
            {summaryLabel}
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
        {/* ROW 1: Pencarian Utama & Select */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Search Box */}
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari nomor order / receipt..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9 bg-background shadow-sm border-border/60 focus:border-primary focus:ring-primary/20 transition-all h-10"
            />
          </div>

          <Select
            value={paymentStatus}
            onValueChange={(v) => setPaymentStatus(v as "all" | PaymentStatus)}
          >
            <SelectTrigger className="bg-background shadow-sm border-border/60 h-10">
              <SelectValue placeholder="Status Pembayaran" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Pembayaran</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Lunas (Paid)</SelectItem>
              <SelectItem value="failed">Gagal (Failed)</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={orderStatus}
            onValueChange={(v) => setOrderStatus(v as "all" | OrderStatus)}
          >
            <SelectTrigger className="bg-background shadow-sm border-border/60 h-10">
              <SelectValue placeholder="Status Pesanan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="received">Diterima</SelectItem>
              <SelectItem value="preparing">Dibuat</SelectItem>
              <SelectItem value="served">Disajikan</SelectItem>
              <SelectItem value="completed">Selesai</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={paymentMethod}
            onValueChange={(v) => setPaymentMethod(v as "all" | PaymentMethod)}
          >
            <SelectTrigger className="bg-background shadow-sm border-border/60 h-10">
              <SelectValue placeholder="Metode Bayar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Metode</SelectItem>
              <SelectItem value="cash">Tunai (Cash)</SelectItem>
              <SelectItem value="online">Digital / QRIS</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="h-px bg-border/40 w-full" />

        {/* ROW 2: Date Picker & Quick Actions */}
        <div className="flex flex-col lg:flex-row gap-5 justify-between items-start lg:items-end">
          {/* Grid responsif untuk input kecil: 2 kolom di HP, 4 kolom di PC */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full lg:w-auto">
            {/* Table Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                No Meja
              </label>
              <Input
                placeholder="Cth: 4"
                value={table}
                onChange={(e) => setTable(e.target.value)}
                inputMode="numeric"
                className="bg-background shadow-sm h-9"
              />
            </div>

            {/* Page Size */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Tampil
              </label>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  const n = Number(v);
                  setPageSize(Number.isFinite(n) ? n : 20);
                  setPage(1);
                }}
              >
                <SelectTrigger className="bg-background shadow-sm h-9">
                  <SelectValue placeholder="Baris" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 baris</SelectItem>
                  <SelectItem value="20">20 baris</SelectItem>
                  <SelectItem value="50">50 baris</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Dari */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <CalendarDays className="w-3 h-3" /> Dari
              </label>
              <Input
                type="date"
                value={from}
                onChange={(e) => onChangeFrom(e.target.value)}
                className="bg-background shadow-sm h-9 text-xs sm:text-sm"
              />
            </div>

            {/* Date Sampai */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <CalendarDays className="w-3 h-3" /> Sampai
              </label>
              <Input
                type="date"
                value={to}
                onChange={(e) => onChangeTo(e.target.value)}
                className="bg-background shadow-sm h-9 text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto mt-2 lg:mt-0">
            <div className="grid grid-cols-4 sm:flex gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onQuickToday}
                className="text-[10px] sm:text-xs h-9"
              >
                Hari ini
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onQuickYesterday}
                className="text-[10px] sm:text-xs h-9"
              >
                Kemarin
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onQuickLast7}
                className="text-[10px] sm:text-xs h-9"
              >
                7 Hari
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onQuickThisMonth}
                className="text-[10px] sm:text-xs h-9"
              >
                Bulan ini
              </Button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onReset}
              className="text-xs h-9 w-full sm:w-auto text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-2" /> Reset
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
