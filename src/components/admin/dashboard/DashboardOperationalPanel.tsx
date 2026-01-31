"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ManualDiscountDialog } from "@/components/admin/ManualDiscountDialog";
import type {
  ActiveOrder,
  FulfillmentStatus,
} from "@/lib/admin-services/overview";
import { TablesCard } from "@/components/admin/dashboard/TablesCard";
import { CashPendingCard } from "@/components/admin/dashboard/CashPendingCard";
import { OrderReceivedCard } from "@/components/admin/dashboard/OrderReceivedCard";
import { OrderPreparingCard } from "@/components/admin/dashboard/OrderPreparingCard";
import { OrderServedCard } from "@/components/admin/dashboard/OrderServedCard";
import { Table } from "@/types/index";


// ... safeMessage function ...
function safeMessage(json: unknown, fallback: string) {
  if (typeof json === "object" && json !== null && "message" in json) {
    return String((json as Record<string, unknown>).message);
  }
  return fallback;
}

interface DashboardOperationalPanelProps {
  tables: Table[]; 
  orders: ActiveOrder[];
  onRefresh: () => Promise<void>;
  adminRole?: "kasir" | "owner";
}

export default function DashboardOperationalPanel({
  tables,
  orders,
  onRefresh,
  adminRole = "kasir",
}: DashboardOperationalPanelProps)
{
  const [discountDialog, setDiscountDialog] = useState<ActiveOrder | null>(
    null,
  );

  const cashPending = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.payment_method === "cash" &&
          o.payment_status === "pending" &&
          o.completed_at === null,
      ),
    [orders],
  );
  const preparing = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.payment_status === "paid" &&
          o.fulfillment_status === "preparing" &&
          o.completed_at === null,
      ),
    [orders],
  );
  const receivedPaid = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.payment_status === "paid" &&
          o.fulfillment_status === "received" &&
          o.completed_at === null,
      ),
    [orders],
  );
  const activeServed = useMemo(
    () =>
      orders.filter(
        (o) => o.fulfillment_status === "served" && o.completed_at === null,
      ),
    [orders],
  );

  const confirmCash = async (orderNumber: string) => {
    try {
      const res = await fetch("/api/admin/orders/confirm-cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber }),
      });
      const json = (await res.json()) as unknown;
      if (!res.ok) throw new Error(safeMessage(json, "Gagal konfirmasi tunai"));
      toast.success("Tunai dikonfirmasi (paid)");
      await onRefresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  };

  const setFulfillmentStatus = async (
    orderId: string,
    status: FulfillmentStatus,
  ) => {
    try {
      const res = await fetch("/api/admin/orders/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
        cache: "no-store",
      });
      const json = (await res.json()) as unknown;
      if (!res.ok) throw new Error(safeMessage(json, "Gagal update status"));
      toast.success("Status order berhasil diupdate");
      await onRefresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  };

  const completeOrder = async (orderNumber: string) => {
    try {
      const res = await fetch("/api/admin/orders/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber }),
      });
      const json = (await res.json()) as unknown;
      if (!res.ok)
        throw new Error(safeMessage(json, "Gagal menyelesaikan order"));
      toast.success("Order selesai, meja dilepas");
      await onRefresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Status Meja (UI Modern) */}
      <section className="space-y-4">
        <TablesCard tables={tables} />
      </section>

      <div className="grid gap-8">
        {/* 2. Pembayaran (Pending) & Order Masuk */}
        {(cashPending.length > 0 || receivedPaid.length > 0) && (
          <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CashPendingCard
              items={cashPending}
              onConfirm={confirmCash}
              // FITUR SPESIAL OWNER: Button Diskon
              onDiscount={
                adminRole === "owner"
                  ? (order) => setDiscountDialog(order)
                  : undefined
              }
            />

            <OrderReceivedCard
              items={receivedPaid}
              onSetStatus={(id, status) =>
                void setFulfillmentStatus(id, status)
              }
            />
          </div>
        )}

        {/* 3. Dapur (Sedang Dibuat) */}
        <OrderPreparingCard
          items={preparing}
          onSetStatus={(id, status) => void setFulfillmentStatus(id, status)}
        />

        <OrderServedCard items={activeServed} onComplete={completeOrder} />
      </div>

      {discountDialog && (
        <ManualDiscountDialog
          order={discountDialog}
          open={!!discountDialog}
          adminRole={adminRole}
          onClose={() => setDiscountDialog(null)}
          onSuccess={() => {
            setDiscountDialog(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
