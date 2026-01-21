"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { AdminRole } from "@/lib/admin-auth";
import DashboardOperationalPanel, {
  type ActiveOrder,
} from "@/components/admin/dashboard/DashboardOperationalPanel";
import { DashboardAutoRefresh } from "@/components/admin/dashboard/DashboardAutoRefresh";
import { useAutoCancelExpiredOrders } from "@/hooks/useAutoCancelExpiredOrders";
import { logout } from "@/lib/logout";

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

export default function AdminDashboardClient({
  role,
}: {
  role: AdminRole | null;
}) {
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
          `${result.cancelled} order cash expired dibatalkan otomatis`,
          {
            description: `Order: ${result.orders.join(", ")}`,
            duration: 5000,
          },
        );
        void fetchOverview();
      }
    },
    onError: (error) => {
      console.error("Auto-cancel error:", error);
    },
  });

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6 lg:space-y-8">
        {/* Header Kasir */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Dashboard Kasir
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Kelola meja, pantau order, dan proses pembayaran
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {role === "owner" && (
              <Link href="/admin/owner" className="flex-1 sm:flex-none">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto bg-transparent"
                >
                  Ke Dashboard Owner
                </Button>
              </Link>
            )}

            <Button
              variant="secondary"
              onClick={fetchOverview}
              disabled={loading}
              className="flex-1 sm:flex-none"
            >
              {loading ? "Loading..." : "Refresh"}
            </Button>

            <Link href="/admin/history" className="flex-1 sm:flex-none">
              <Button
                variant="outline"
                className="w-full sm:w-auto bg-transparent"
              >
                History Pesanan
              </Button>
            </Link>

            <Button variant="outline" onClick={logout}>
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

        <DashboardOperationalPanel
          tables={tables}
          orders={orders}
          onRefresh={fetchOverview}
        />
      </div>
    </main>
  );
}
