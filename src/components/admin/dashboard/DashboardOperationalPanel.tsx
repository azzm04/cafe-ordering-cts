"use client";

import Link from "next/link";
import { useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatWaktuID, timeAgoShort } from "@/lib/time";

type TableRow = {
  id: string;
  table_number: number;
  status: "available" | "occupied" | "reserved";
};

type FulfillmentStatus = "received" | "preparing" | "served" | "completed";
type PaymentStatus = "pending" | "paid" | "failed" | "expired";

export type ActiveOrder = {
  id: string;
  order_number: string;
  total_amount: number;
  payment_status: PaymentStatus;
  payment_method: string | null;
  fulfillment_status: FulfillmentStatus;
  created_at: string;
  completed_at: string | null;
  table_id: string;
  tables?: { table_number: number } | null;
};

function safeMessage(json: unknown, fallback: string) {
  if (typeof json === "object" && json !== null && "message" in json) {
    return String((json as Record<string, unknown>).message);
  }
  return fallback;
}

export default function DashboardOperationalPanel({
  tables,
  orders,
  onRefresh,
}: {
  tables: TableRow[];
  orders: ActiveOrder[];
  onRefresh: () => Promise<void>;
}) {
  const cashPending = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.payment_method === "cash" &&
          o.payment_status === "pending" &&
          o.completed_at === null
      ),
    [orders]
  );

  const preparing = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.payment_status === "paid" &&
          o.fulfillment_status === "preparing" &&
          o.completed_at === null
      ),
    [orders]
  );

  const receivedPaid = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.payment_status === "paid" &&
          o.fulfillment_status === "received" &&
          o.completed_at === null
      ),
    [orders]
  );

  const activeServed = useMemo(
    () => orders.filter((o) => o.fulfillment_status === "served" && o.completed_at === null),
    [orders]
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

  const setFulfillmentStatus = async (orderId: string, status: FulfillmentStatus) => {
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
      if (!res.ok) throw new Error(safeMessage(json, "Gagal menyelesaikan order"));

      toast.success("Order selesai, meja dilepas");
      await onRefresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      <Card className="p-4 sm:p-6 space-y-4">
        <h2 className="text-lg font-semibold">Status Meja</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
          {tables.map((t) => (
            <Card key={t.id} className="p-3 space-y-2 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center gap-2">
                <span className="font-medium text-sm">Meja {t.table_number}</span>
                <Badge
                  variant={t.status === "occupied" ? "destructive" : "secondary"}
                  className="text-xs"
                >
                  {t.status === "occupied" ? "Terisi" : "Kosong"}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <Card className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Tunai Pending</h2>
          <Badge variant="secondary" className="w-fit">
            Butuh Konfirmasi
          </Badge>
        </div>

        {cashPending.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tidak ada pembayaran tunai yang pending.</p>
        ) : (
          <div className="space-y-3">
            {cashPending.map((o) => (
              <Card key={o.id} className="p-3 sm:p-4 space-y-3 border-l-4 border-l-destructive">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="font-semibold">{o.order_number}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Meja {o.tables?.table_number ?? "-"} • Tunai • Pending
                    </div>
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-primary">
                    Rp {Number(o.total_amount).toLocaleString("id-ID")}
                  </div>
                </div>
                <Button onClick={() => confirmCash(o.order_number)} className="w-full sm:w-auto">
                  Konfirmasi Tunai
                </Button>
              </Card>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Order Baru Masuk</h2>
          <Badge variant="secondary" className="w-fit">
            Belum Mulai
          </Badge>
        </div>

        {receivedPaid.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tidak ada order baru masuk.</p>
        ) : (
          <div className="space-y-3">
            {receivedPaid.map((o) => (
              <Card key={o.id} className="p-3 sm:p-4 space-y-3 border-l-4 border-l-accent">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div>
                    <div className="font-semibold">{o.order_number}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      {formatWaktuID(o.created_at)} • {timeAgoShort(o.created_at)}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                      Meja {o.tables?.table_number ?? "-"} •{" "}
                      {o.payment_method === "cash" ? "Tunai" : "Midtrans"}
                    </div>
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-primary">
                    Rp {Number(o.total_amount).toLocaleString("id-ID")}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Link
                    href={`/admin/print/kitchen/${o.order_number}`}
                    target="_blank"
                    className="flex-1"
                  >
                    <Button variant="secondary" className="w-full text-xs sm:text-sm">
                      Print Dapur
                    </Button>
                  </Link>

                  <Link href={`/admin/print/bar/${o.order_number}`} target="_blank" className="flex-1">
                    <Button variant="secondary" className="w-full text-xs sm:text-sm">
                      Print Bar
                    </Button>
                  </Link>

                  <Button onClick={() => void setFulfillmentStatus(o.id, "preparing")} className="flex-1">
                    Mulai Buat
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Sedang Dibuat</h2>
          <Badge variant="secondary" className="w-fit">
            Dalam Proses
          </Badge>
        </div>

        {preparing.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tidak ada order yang sedang dibuat.</p>
        ) : (
          <div className="space-y-3">
            {preparing.map((o) => (
              <Card key={o.id} className="p-3 sm:p-4 space-y-3 border-l-4 border-l-secondary">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div>
                    <div className="font-semibold">{o.order_number}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      {formatWaktuID(o.created_at)} • {timeAgoShort(o.created_at)}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                      Meja {o.tables?.table_number ?? "-"} •{" "}
                      {o.payment_method === "cash" ? "Tunai" : "Midtrans"}
                    </div>
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-primary">
                    Rp {Number(o.total_amount).toLocaleString("id-ID")}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Link
                    href={`/admin/print/kitchen/${o.order_number}`}
                    target="_blank"
                    className="flex-1"
                  >
                    <Button variant="secondary" className="w-full text-xs sm:text-sm">
                      Print Dapur
                    </Button>
                  </Link>

                  <Link href={`/admin/print/bar/${o.order_number}`} target="_blank" className="flex-1">
                    <Button variant="secondary" className="w-full text-xs sm:text-sm">
                      Print Bar
                    </Button>
                  </Link>

                  <Button onClick={() => void setFulfillmentStatus(o.id, "served")} className="flex-1">
                    Sudah Selesai
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Order Aktif</h2>
          <Badge variant="secondary" className="w-fit">
            Menunggu
          </Badge>
        </div>

        {activeServed.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tidak ada order aktif.</p>
        ) : (
          <div className="space-y-3">
            {activeServed.map((o) => (
              <Card key={o.id} className="p-3 sm:p-4 space-y-3 border-l-4 border-l-primary">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="font-semibold">{o.order_number}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Meja {o.tables?.table_number ?? "-"} •{" "}
                      {o.payment_method === "cash" ? "Tunai" : "Midtrans"} • Sudah Disajikan
                    </div>
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-primary">
                    Rp {Number(o.total_amount).toLocaleString("id-ID")}
                  </div>
                </div>

                <Button variant="outline" onClick={() => completeOrder(o.order_number)} className="w-full">
                  Selesaikan & Lepas Meja
                </Button>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
