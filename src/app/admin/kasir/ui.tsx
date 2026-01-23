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
import {
  confirmCashOrder,
  completeOrder,
  updateFulfillmentStatus,
} from "@/lib/admin-services/orders";
import { useAutoCancelExpiredOrders } from "@/hooks/useAutoCancelExpiredOrders";

export default function AdminKasirDashboardClient() {
  const {
    tables,
    loading,
    refresh,
    cashPending,
    receivedPaid,
    preparing,
    activeServed,
  } = useAdminOverview();

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
        void refresh();
      }
    },
    onError: (error) => {
      console.error("Auto-cancel client error:", error);
    },
  });

  return (
    <main className="min-h-screen bg-background relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0"></div>

      <div className="relative z-10 mx-auto max-w-400 p-4 sm:p-6 lg:p-8 space-y-8">
        <DashboardHeader
          title="Dashboard Kasir"
          onRefresh={refresh}
          loading={loading}
        />

        <DashboardAutoRefresh
          intervalMs={5000}
          enabled={true}
          onRefresh={refresh}
        />

        <section className="space-y-4">
          <h3 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span className="w-1.5 h-6 bg-primary rounded-full"></span>
            Status Meja
          </h3>
          <TablesCard tables={tables} />
        </section>

        {/* Workflow Section */}
        <div className="grid gap-8">
          {/* 1. Pembayaran & Order Masuk */}
          {(cashPending.length > 0 || receivedPaid.length > 0) && (
            <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CashPendingCard
                items={cashPending}
                onConfirm={async (orderNumber) => {
                  try {
                    await confirmCashOrder(orderNumber);
                    toast.success("Pembayaran tunai berhasil dikonfirmasi");
                    await refresh();
                  } catch (e: unknown) {
                    toast.error(
                      e instanceof Error ? e.message : "Gagal konfirmasi",
                    );
                  }
                }}
              />

              <OrderReceivedCard
                items={receivedPaid}
                onSetStatus={async (orderId, status) => {
                  try {
                    await updateFulfillmentStatus(orderId, status);
                    toast.success("Order masuk ke dapur");
                    await refresh();
                  } catch (e: unknown) {
                    toast.error(
                      e instanceof Error ? e.message : "Gagal update status",
                    );
                  }
                }}
              />
            </div>
          )}

          {/* 2. Proses Dapur */}
          <OrderPreparingCard
            items={preparing}
            onSetStatus={async (orderId, status) => {
              try {
                await updateFulfillmentStatus(orderId, status);
                toast.success("Makanan siap disajikan");
                await refresh();
              } catch (e: unknown) {
                toast.error(
                  e instanceof Error ? e.message : "Gagal update status",
                );
              }
            }}
          />

          {/* 3. Selesai / Disajikan */}
          <OrderServedCard
            items={activeServed}
            onComplete={async (orderNumber) => {
              try {
                await completeOrder(orderNumber);
                toast.success("Order selesai, meja kembali kosong");
                await refresh();
              } catch (e: unknown) {
                toast.error(
                  e instanceof Error ? e.message : "Gagal menyelesaikan order",
                );
              }
            }}
          />
        </div>
      </div>
    </main>
  );
}
