// admin/kasir/ui.tsx
"use client";

import { toast } from "sonner";
import { useAdminOverview } from "@/hooks/useAdminOverview";
import { DashboardHeader } from "@/components/admin/dashboard/DashboardHeader";
import { TablesCard } from "@/components/admin/dashboard/TablesCard";
import { CashPendingCard } from "@/components/admin/dashboard/CashPendingCard";
import { OrderReceivedCard } from "@/components/admin/dashboard/OrderReceivedCard";
import { OrderPreparingCard } from "@/components/admin/dashboard/OrderPreparingCard";
import { OrderServedCard } from "@/components/admin/dashboard/OrderServedCard";
import { DashboardAutoRefresh } from "@/components/admin/dashboard/DashboardAutoRefresh";
import { confirmCashOrder, completeOrder, updateFulfillmentStatus } from "@/lib/admin-services/orders";
import { useAutoCancelExpiredOrders } from "@/hooks/useAutoCancelExpiredOrders";

export default function AdminKasirDashboardClient() {
  const { tables, loading, refresh, cashPending, receivedPaid, preparing, activeServed } = useAdminOverview();

  useAutoCancelExpiredOrders({
    enabled: true,
    intervalMs: 15 * 60 * 1000, // Cek setiap 15 menit
    onSuccess: (result) => {
      if (result.cancelled > 0) {
        toast.warning(
          `${result.cancelled} order cash expired dibatalkan otomatis`,
          {
            description: `Order: ${result.orders.join(", ")}`,
            duration: 5000,
          }
        );
        void refresh();
      }
    },
    onError: (error) => {
      console.error("Auto-cancel client error:", error);
    },
  });

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6 lg:space-y-8">
        <DashboardHeader
          title="Dashboard Kasir"
          subtitle="Kelola meja, pantau order, dan proses pembayaran"
          onRefresh={refresh}
          loading={loading}
        />

        <div className="flex items-center justify-between px-4 py-3 bg-muted/30 rounded-lg border border-border/50">
          <DashboardAutoRefresh intervalMs={5000} enabled={true} onRefresh={refresh} />
        </div>

        <TablesCard tables={tables} />

        <CashPendingCard
          items={cashPending}
          onConfirm={async (orderNumber) => {
            try {
              await confirmCashOrder(orderNumber);
              toast.success("Tunai dikonfirmasi (paid)");
              await refresh();
            } catch (e: unknown) {
              toast.error(e instanceof Error ? e.message : "Error");
            }
          }}
        />

        <OrderReceivedCard
          items={receivedPaid}
          onSetStatus={async (orderId, status) => {
            try {
              await updateFulfillmentStatus(orderId, status);
              toast.success("Status order berhasil diupdate");
              await refresh();
            } catch (e: unknown) {
              toast.error(e instanceof Error ? e.message : "Error");
            }
          }}
        />

        <OrderPreparingCard
          items={preparing}
          onSetStatus={async (orderId, status) => {
            try {
              await updateFulfillmentStatus(orderId, status);
              toast.success("Status order berhasil diupdate");
              await refresh();
            } catch (e: unknown) {
              toast.error(e instanceof Error ? e.message : "Error");
            }
          }}
        />

        <OrderServedCard
          items={activeServed}
          onComplete={async (orderNumber) => {
            try {
              await completeOrder(orderNumber);
              toast.success("Order selesai, meja dilepas");
              await refresh();
            } catch (e: unknown) {
              toast.error(e instanceof Error ? e.message : "Error");
            }
          }}
        />
      </div>
    </main>
  );
}