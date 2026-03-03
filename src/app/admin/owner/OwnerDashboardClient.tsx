"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import AlertsDropdown from "@/components/admin/AlertsDropdown";
import BackgroundDecorations from "@/components/shared/BackgroundDecorations";
import DashboardOperationalPanel from "@/components/admin/dashboard/DashboardOperationalPanel";
import type { ActiveOrder } from "@/lib/admin-services/overview";
import { DashboardHeader } from "@/components/admin/dashboard/DashboardHeader";
import { DashboardAutoRefresh } from "@/components/admin/dashboard/DashboardAutoRefresh";
import { useAutoCancelExpiredOrders } from "@/hooks/useAutoCancelExpiredOrders";
import { useSessionGuard } from "@/hooks/useSessionGuard";
import { FileBarChart, TicketPercent, UtensilsCrossed } from "lucide-react";
import { Table } from "@/types/index";

type OverviewResponse = { 
  tables: Table[]; 
  activeOrders: ActiveOrder[] 
};

function safeMessage(json: unknown, fallback: string) {
  if (typeof json === "object" && json !== null && "message" in json) {
    return String((json as Record<string, unknown>).message);
  }
  return fallback;
}

export default function OwnerDashboardClient() {
  useSessionGuard();
  
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<ActiveOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/overview?t=${Date.now()}`, { cache: "no-store" });
      const json = await res.json();
      
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

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden">
      <BackgroundDecorations />

      <div className="relative z-10 mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8 space-y-8">
        
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
              
              <div className="flex items-center gap-1 ml-2">
                <AlertsDropdown />
              </div>
            </div>
          }
        />

        <Card className="overflow-hidden border-0 shadow-md bg-white/60 backdrop-blur-sm">
          <div className="px-4 py-3">
            <DashboardAutoRefresh intervalMs={5000} enabled={true} onRefresh={fetchOverview} />
          </div>
        </Card>

        {/* Operational Panel sekarang menerima tipe Table[] yang konsisten */}
        <DashboardOperationalPanel
          tables={tables}
          orders={orders}
          onRefresh={fetchOverview}
          adminRole="owner"
        />

        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">
            Dashboard Owner • Auto-refresh setiap 5 detik
          </p>
        </div>
      </div>
    </main>
  );
}