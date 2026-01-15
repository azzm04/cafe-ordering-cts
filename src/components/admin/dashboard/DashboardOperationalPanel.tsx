"use client";

import Link from "next/link";
import { useMemo, useState } from "react"; // Tambah useState
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag } from "lucide-react"; // Tambah Icon Tag
import { formatWaktuID, timeAgoShort } from "@/lib/time";
import { ManualDiscountDialog } from "@/components/admin/ManualDiscountDialog"; // Import Dialog

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
  // Pastikan field ini ada untuk diskon
  original_amount?: number;
  discount_amount?: number;
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
  adminRole = "kasir", // Default ke kasir
}: {
  tables: TableRow[];
  orders: ActiveOrder[];
  onRefresh: () => Promise<void>;
  adminRole?: "owner" | "kasir"; // Props adminRole
}) {
  // State untuk Dialog Diskon
  const [discountDialog, setDiscountDialog] = useState<ActiveOrder | null>(null);

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
      {/* 1. Status Meja */}
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

      {/* 2. Tunai Pending (ADA DISKON) */}
      <Card className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Tunai Pending</h2>
          <Badge variant="secondary" className="w-fit bg-amber-100 text-amber-700 hover:bg-amber-100">
            Butuh Konfirmasi
          </Badge>
        </div>

        {cashPending.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tidak ada pembayaran tunai yang pending.</p>
        ) : (
          <div className="space-y-3">
            {cashPending.map((o) => (
              <Card key={o.id} className="p-3 sm:p-4 space-y-3 border-l-4 border-l-amber-500">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="font-semibold">{o.order_number}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      {/* Format waktu seperti CashPendingCard */}
                      {formatWaktuID(o.created_at)} • {timeAgoShort(o.created_at)}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                      Meja {o.tables?.table_number ?? "-"} • Tunai
                    </div>
                  </div>
                  
                  {/* Harga & Info Diskon */}
                  <div>
                    <div className="text-lg sm:text-xl font-bold text-amber-700 text-right sm:text-left">
                      Rp {Number(o.total_amount).toLocaleString("id-ID")}
                    </div>
                    {/* Tampilkan info jika ada diskon */}
                    {o.discount_amount && o.discount_amount > 0 && (
                      <div className="text-xs text-emerald-600 text-right">
                        Diskon: -Rp {o.discount_amount.toLocaleString("id-ID")}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2">
                  {/* Button Diskon (Hanya Owner) */}
                  {adminRole === "owner" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDiscountDialog(o)}
                      className="flex-1 sm:flex-none"
                    >
                      <Tag className="h-4 w-4 mr-1" />
                      Beri Diskon
                    </Button>
                  )}

                  <Button 
                    onClick={() => confirmCash(o.order_number)} 
                    className="flex-1 bg-amber-600 hover:bg-amber-700"
                    size="sm"
                  >
                    Konfirmasi Tunai
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* 3. Order Baru Masuk */}
      <Card className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Order Baru Masuk</h2>
          <Badge variant="secondary" className="w-fit">Belum Mulai</Badge>
        </div>

        {receivedPaid.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tidak ada order baru masuk.</p>
        ) : (
          <div className="space-y-3">
            {receivedPaid.map((o) => (
              <Card key={o.id} className="p-3 sm:p-4 space-y-3 border-l-4 border-l-accent">
                {/* ... Isi card sama seperti sebelumnya ... */}
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

      {/* 4. Sedang Dibuat */}
      <Card className="p-4 sm:p-6 space-y-4">
        {/* ... (Tidak ada perubahan logika, hanya render) ... */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Sedang Dibuat</h2>
          <Badge variant="secondary" className="w-fit">Dalam Proses</Badge>
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
                   {/* Tombol Print & Selesai */}
                   <Link href={`/admin/print/kitchen/${o.order_number}`} target="_blank" className="flex-1">
                    <Button variant="secondary" className="w-full text-xs sm:text-sm">Print Dapur</Button>
                  </Link>
                  <Link href={`/admin/print/bar/${o.order_number}`} target="_blank" className="flex-1">
                    <Button variant="secondary" className="w-full text-xs sm:text-sm">Print Bar</Button>
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

      {/* 5. Order Aktif (Served) */}
      <Card className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Order Aktif</h2>
          <Badge variant="secondary" className="w-fit">Menunggu</Badge>
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

      {/* MANUAL DISCOUNT DIALOG (Global di panel) */}
      {discountDialog && (
        <ManualDiscountDialog
          order={discountDialog}
          open={!!discountDialog}
          adminRole={adminRole}
          onClose={() => setDiscountDialog(null)}
          onSuccess={() => {
            setDiscountDialog(null);
            onRefresh(); // Refresh data tanpa reload page
          }}
        />
      )}
    </div>
  );
}