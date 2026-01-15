"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import AlertsDropdown from "@/components/admin/AlertsDropdown";
import StockAlertBadge from "@/components/admin/StockAlertBadge";
import DashboardOperationalPanel, {
  type ActiveOrder,
} from "@/components/admin/dashboard/DashboardOperationalPanel";
import { DashboardAutoRefresh } from "@/components/admin/dashboard/DashboardAutoRefresh";
import { useAutoCancelExpiredOrders } from "@/hooks/useAutoCancelExpiredOrders";
import VoucherManager from "@/components/admin/dashboard/VoucherManager";

type TableRow = {
  id: string;
  table_number: number;
  status: "available" | "occupied" | "reserved";
};

type OverviewResponse = {
  tables: TableRow[];
  activeOrders: ActiveOrder[];
};

function safeMessage(json: unknown, fallback: string) {
  if (typeof json === "object" && json !== null && "message" in json) {
    return String((json as Record<string, unknown>).message);
  }
  return fallback;
}

export default function OwnerDashboardClient() {
  const [tables, setTables] = useState<TableRow[]>([]);
  const [orders, setOrders] = useState<ActiveOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/overview?t=${Date.now()}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as unknown;
      if (!res.ok) throw new Error(safeMessage(json, "Gagal load dashboard"));

      const data = json as OverviewResponse;
      setTables(data.tables ?? []);
      setOrders(data.activeOrders ?? []);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOverview();
  }, [fetchOverview]);

  useAutoCancelExpiredOrders({
    enabled: true,
    intervalMs: 15 * 60 * 1000,
    onSuccess: (result) => {
      if (result.cancelled > 0) {
        toast.warning(
          `${result.cancelled} order cash expired dibatalkan otomatis`
        );
        void fetchOverview();
      }
    },
    onError: (error) => console.error(error),
  });

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6 lg:space-y-8">
        {/* Header Owner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Dashboard Owner
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Pantau operasional & akses cepat ke fitur manajemen
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="secondary"
              onClick={fetchOverview}
              disabled={loading}
              className="flex-1 sm:flex-none"
            >
              {loading ? "Loading..." : "Refresh"}
            </Button>

            <Link href="/admin/menu" className="flex-1 sm:flex-none">
              <Button
                variant="outline"
                className="w-full sm:w-auto bg-transparent"
              >
                Kelola Menu
              </Button>
            </Link>

            <Link href="/admin/vouchers" className="flex-1 sm:flex-none">
              <Button
                variant="outline"
                className="w-full sm:w-auto bg-transparent"
              >
                Kelola Voucher
              </Button>
            </Link>

            <Link href="/admin/laporan" className="flex-1 sm:flex-none">
              <Button
                variant="outline"
                className="w-full sm:w-auto bg-transparent"
              >
                Laporan
              </Button>
            </Link>

            <div className="flex items-center gap-2">
              <AlertsDropdown />
              <StockAlertBadge />
            </div>

            <Link href="/admin/history" className="flex-1 sm:flex-none">
              <Button
                variant="outline"
                className="w-full sm:w-auto bg-transparent"
              >
                History Pesanan
              </Button>
            </Link>

            <Button
              variant="outline"
              onClick={() => {
                document.cookie =
                  "cts_admin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                location.href = "/admin/login";
              }}
              className="flex-1 sm:flex-none"
            >
              Logout
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-3 bg-muted/30 rounded-lg border border-border/50">
          <DashboardAutoRefresh
            intervalMs={5000}
            enabled={true}
            onRefresh={fetchOverview}
          />
        </div>

        {/* PASSING ADMIN ROLE = OWNER */}
        <DashboardOperationalPanel
          tables={tables}
          orders={orders}
          onRefresh={fetchOverview}
          adminRole="owner"
        />

        {/* Separator Visual */}
        <div className="my-8 border-t border-border/40" />
      </div>
    </main>
  );
}
