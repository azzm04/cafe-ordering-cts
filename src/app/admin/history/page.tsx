// src/app/admin/history/page.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HistoryFilters } from "@/components/admin/HistoryFilters";
import { HistoryList } from "@/components/admin/HistoryList";
import { useHistory } from "@/hooks/useHistory";

export default function AdminHistoryPage() {
  const {
    filters,
    items,
    total,
    loading,
    totalPages,
    summaryLabel,
    updateFilter,
    setPage,
    setPageSize,
    fetchHistory,
    quickToday,
    quickYesterday,
    quickLast7,
    quickThisMonth,
    resetFilters,
  } = useHistory();

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
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <HistoryFilters
        q={filters.q}
        setQ={(v) => updateFilter("q", v)}
        table={filters.table}
        setTable={(v) => updateFilter("table", v)}
        paymentStatus={filters.paymentStatus}
        setPaymentStatus={(v) => updateFilter("paymentStatus", v)}
        orderStatus={filters.orderStatus}
        setOrderStatus={(v) => updateFilter("orderStatus", v)}
        paymentMethod={filters.paymentMethod}
        setPaymentMethod={(v) => updateFilter("paymentMethod", v)}
        from={filters.from}
        setFrom={(v) => updateFilter("from", v)}
        to={filters.to}
        setTo={(v) => updateFilter("to", v)}
        pageSize={filters.pageSize}
        setPageSize={setPageSize}
        setPage={setPage}
        total={total}
        summaryLabel={summaryLabel}
        onQuickToday={quickToday}
        onQuickYesterday={quickYesterday}
        onQuickLast7={quickLast7}
        onQuickThisMonth={quickThisMonth}
        onReset={resetFilters}
      />

      {/* List */}
      <HistoryList
        items={items}
        loading={loading}
        page={filters.page}
        totalPages={totalPages}
        onPrevPage={() => setPage(Math.max(1, filters.page - 1))}
        onNextPage={() => setPage(Math.min(totalPages, filters.page + 1))}
      />
    </main>
  );
}