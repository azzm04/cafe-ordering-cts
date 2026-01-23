"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import AlertsDropdown from "@/components/admin/AlertsDropdown";
import StockAlertBadge from "@/components/admin/StockAlertBadge";
import DashboardOperationalPanel from "@/components/admin/dashboard/DashboardOperationalPanel";
import type { ActiveOrder } from "@/lib/admin-services/overview";
import { DashboardHeader } from "@/components/admin/dashboard/DashboardHeader";
import { DashboardAutoRefresh } from "@/components/admin/dashboard/DashboardAutoRefresh";
import { ManualOrderDialog } from "@/components/admin/dashboard/ManualOrderDialog";
import { useAutoCancelExpiredOrders } from "@/hooks/useAutoCancelExpiredOrders";
import { useSessionGuard } from "@/hooks/useSessionGuard";
import { FileBarChart, TicketPercent, UtensilsCrossed } from "lucide-react";

// Type definitions
type TableRow = { id: string; table_number: number; status: "available" | "occupied" | "reserved" };
type OverviewResponse = { tables: TableRow[]; activeOrders: ActiveOrder[] };

function safeMessage(json: unknown, fallback: string) {
  if (typeof json === "object" && json !== null && "message" in json) {
    return String((json as Record<string, unknown>).message);
  }
  return fallback;
}

export default function OwnerDashboardClient() {
  useSessionGuard();
  const [tables, setTables] = useState<TableRow[]>([]);
  const [orders, setOrders] = useState<ActiveOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [manualOrderOpen, setManualOrderOpen] = useState(false);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/overview?t=${Date.now()}`, { cache: "no-store" });
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

  useEffect(() => { void fetchOverview(); }, [fetchOverview]);

  useAutoCancelExpiredOrders({
    enabled: true,
    intervalMs: 15 * 60 * 1000,
    onSuccess: (result) => {
      if (result.cancelled > 0) {
        toast.warning(`${result.cancelled} order cash expired dibatalkan otomatis`);
        void fetchOverview();
      }
    },
    onError: (error) => console.error(error),
  });

  const handleManualOrderCreated = () => {
    void fetchOverview();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-stone-100 via-amber-50/30 to-stone-100 relative">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-200/20 rounded-full blur-3xl"></div>
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0"></div>

      <div className="relative z-10 mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8 space-y-8">
        
        {/* Header Modern */}
        <DashboardHeader
          title="Dashboard Owner"
          onRefresh={fetchOverview}
          loading={loading}
          showManualOrder={true}
          rightSlot={
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/menu">
                <Button variant="outline" className="bg-white/50 backdrop-blur-sm h-10 border-amber-200 hover:bg-amber-50 hover:border-amber-300">
                  <UtensilsCrossed className="w-4 h-4 mr-2 text-amber-700" /> Kelola Menu
                </Button>
              </Link>
              <Link href="/admin/vouchers">
                <Button variant="outline" className="bg-white/50 backdrop-blur-sm h-10 border-amber-200 hover:bg-amber-50 hover:border-amber-300">
                  <TicketPercent className="w-4 h-4 mr-2 text-amber-700" /> Voucher
                </Button>
              </Link>
              <Link href="/admin/laporan">
                <Button variant="outline" className="bg-white/50 backdrop-blur-sm h-10 border-amber-200 hover:bg-amber-50 hover:border-amber-300">
                  <FileBarChart className="w-4 h-4 mr-2 text-amber-700" /> Laporan
                </Button>
              </Link>
              
              {/* Alerts */}
              <div className="flex items-center gap-1 ml-2">
                <AlertsDropdown />
                {/* <StockAlertBadge /> */}
              </div>
            </div>
          }
        />

        {/* Auto Refresh Status Bar */}
        <Card className="overflow-hidden border-0 shadow-md bg-white/60 backdrop-blur-sm">
          <div className="px-4 py-3">
            <DashboardAutoRefresh intervalMs={5000} enabled={true} onRefresh={fetchOverview} />
          </div>
        </Card>

        {/* Operational Panel (Reused Modern Components) */}
        <DashboardOperationalPanel
          tables={tables}
          orders={orders}
          onRefresh={fetchOverview}
          adminRole="owner"
        />

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">
            Dashboard Owner • Auto-refresh setiap 5 detik
          </p>
        </div>
      </div>

      {/* Manual Order Dialog
      <ManualOrderDialog
        open={manualOrderOpen}
        onOpenChange={setManualOrderOpen}
        tables={tables}
        onOrderCreated={handleManualOrderCreated}
      /> */}
    </main>
  );
}