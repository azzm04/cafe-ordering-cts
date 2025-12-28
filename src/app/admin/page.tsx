"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatWaktuID, timeAgoShort } from "@/lib/time";

type TableRow = {
  id: string;
  table_number: number;
  status: "available" | "occupied" | "reserved";
};

type OrderStatus = "received" | "served" | "completed";
type PaymentStatus = "pending" | "paid" | "failed" | "expired";

type ActiveOrder = {
  id: string;
  order_number: string;
  total_amount: number;
  payment_status: PaymentStatus;
  payment_method: string | null;
  order_status: OrderStatus;
  created_at: string;
  completed_at: string | null;
  table_id: string;
  tables?: { table_number: number } | null;
};

type OverviewResponse = {
  tables: TableRow[];
  activeOrders: ActiveOrder[];
};

function clearAdminCookie() {
  document.cookie = "cts_admin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

function safeMessage(json: unknown, fallback: string) {
  if (typeof json === "object" && json !== null && "message" in json) {
    return String((json as Record<string, unknown>).message);
  }
  return fallback;
}

export default function AdminPage() {
  const [tables, setTables] = useState<TableRow[]>([]);
  const [orders, setOrders] = useState<ActiveOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOverview = async () => {
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
  };

  useEffect(() => {
    void fetchOverview();
  }, []);

  // 1) Tunai pending: cash + pending + belum completed
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

  // 2) Sedang dibuat: sudah paid + received + belum completed (cash & qris)
  const preparing = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.payment_status === "paid" &&
          o.order_status === "received" &&
          o.completed_at === null
      ),
    [orders]
  );

  // 3) Aktif: served + belum completed
  const activeServed = useMemo(
    () =>
      orders.filter(
        (o) => o.order_status === "served" && o.completed_at === null
      ),
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
      await fetchOverview();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  };

  const markServed = async (orderNumber: string) => {
    try {
      const res = await fetch("/api/admin/orders/mark-served", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber }),
      });
      const json = (await res.json()) as unknown;
      if (!res.ok) throw new Error(safeMessage(json, "Gagal update status"));

      toast.success("Order ditandai sudah diserahkan");
      await fetchOverview();
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
      await fetchOverview();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  };

  
  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Kasir</h1>
          <p className="text-sm opacity-70">Kelola meja & proses order.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/menu">
            <Button variant="outline">Kelola Menu</Button>
          </Link>

          <Button
            variant="secondary"
            onClick={fetchOverview}
            disabled={loading}
          >
            Refresh
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              document.cookie =
                "cts_admin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
              location.href = "/admin/login";
            }}
          >
            Logout
          </Button>
        </div>
      </div>

      {/* STATUS MEJA */}
      <Card className="p-4 space-y-3">
        <h2 className="font-semibold">Status Meja</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {tables.map((t) => (
            <Card key={t.id} className="p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Meja {t.table_number}</span>
                <Badge
                  variant={
                    t.status === "occupied" ? "destructive" : "secondary"
                  }
                >
                  {t.status}
                </Badge>
              </div>
              <p className="text-xs opacity-60">OK</p>
            </Card>
          ))}
        </div>
      </Card>

      {/* 1) TUNAI PENDING */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Tunai Pending (Hanya Cash)</h2>
          <Badge variant="secondary">Butuh konfirmasi kasir</Badge>
        </div>

        {cashPending.length === 0 ? (
          <p className="text-sm opacity-60">
            Tidak ada pembayaran tunai pending.
          </p>
        ) : (
          <div className="space-y-3">
            {cashPending.map((o) => (
              <Card key={o.id} className="p-4 space-y-2">
                <div className="font-medium">{o.order_number}</div>
                <div className="text-sm opacity-70">
                  Meja {o.tables?.table_number ?? "-"} • cash •{" "}
                  <span className="font-medium">{o.payment_status}</span> •{" "}
                  <span className="font-medium">{o.order_status}</span>
                </div>
                <div className="pt-2">
                  <Button onClick={() => confirmCash(o.order_number)}>
                    Konfirmasi Tunai (Paid)
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* 2) ORDERAN SEDANG DIBUAT */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Orderan Sedang Dibuat</h2>
          <Badge variant="secondary">Paid • received</Badge>
        </div>

        {preparing.length === 0 ? (
          <p className="text-sm opacity-60">
            Tidak ada order yang sedang dibuat.
          </p>
        ) : (
          <div className="space-y-3">
            {preparing.map((o) => (
              <Card key={o.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="font-semibold">{o.order_number}</div>

                    <div className="text-xs opacity-70">
                      {formatWaktuID(o.created_at)} •{" "}
                      {timeAgoShort(o.created_at)}
                    </div>
                  </div>
                </div>

                <div className="text-sm opacity-70">
                  Meja {o.tables?.table_number ?? "-"} •{" "}
                  {o.payment_method ?? "midtrans"} •{" "}
                  <span className="font-medium">{o.payment_status}</span> •{" "}
                  <span className="font-medium">{o.order_status}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/admin/print/kitchen/${o.order_number}`}
                    target="_blank"
                  >
                    <Button variant="secondary">Print Dapur (Makanan)</Button>
                  </Link>

                  <Link
                    href={`/admin/print/bar/${o.order_number}`}
                    target="_blank"
                  >
                    <Button variant="secondary">Print Bar (Minuman)</Button>
                  </Link>

                  <Button onClick={() => void markServed(o.order_number)}>
                    Tandai Sudah Dibuat / Diserahkan
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* 3) ORDER AKTIF (SERVED) */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Order Aktif (Belum Completed)</h2>
          <Badge variant="secondary">served</Badge>
        </div>

        {activeServed.length === 0 ? (
          <p className="text-sm opacity-60">Tidak ada order aktif.</p>
        ) : (
          <div className="space-y-3">
            {activeServed.map((o) => (
              <Card key={o.id} className="p-4 space-y-2">
                <div className="font-medium">{o.order_number}</div>

                <div className="text-sm opacity-70">
                  Meja {o.tables?.table_number ?? "-"} •{" "}
                  {o.payment_method ?? "midtrans"} •{" "}
                  <span className="font-medium">{o.payment_status}</span> •{" "}
                  <span className="font-medium">{o.order_status}</span>
                </div>

                <div className="pt-2">
                  <Button
                    variant="outline"
                    onClick={() => completeOrder(o.order_number)}
                  >
                    Selesaikan Pesanan (Release Meja)
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </main>
  );
}
