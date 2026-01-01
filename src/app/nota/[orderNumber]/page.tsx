import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatRupiah } from "@/lib/utils";
import { RefreshButton } from "@/components/RefreshButton";

export const dynamic = "force-dynamic";

type Params = { orderNumber: string };

type PaymentStatus = "pending" | "paid" | "failed" | "expired";
type FulfillmentStatus = "received" | "preparing" | "served" | "completed";

type OrderWithTable = {
  id: string;
  order_number: string;
  total_amount: number;
  payment_status: PaymentStatus;
  payment_method: string | null;
  fulfillment_status: FulfillmentStatus;
  created_at: string;
  completed_at: string | null;
  tables?: { table_number: number } | null;
};

type OrderItemWithMenu = {
  id: string;
  menu_item_id: string;
  quantity: number;
  price: number;
  subtotal: number;
  notes: string | null;
  menu_items: { name: string } | null;
};

const paymentConfig: Record<
  PaymentStatus,
  {
    label: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
    dotColor: string;
  }
> = {
  paid: {
    label: "Sudah Dibayar",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-200",
    dotColor: "bg-emerald-500",
  },
  pending: {
    label: "Menunggu Pembayaran",
    bgColor: "bg-amber-50",
    textColor: "text-amber-700",
    borderColor: "border-amber-200",
    dotColor: "bg-amber-500",
  },
  failed: {
    label: "Pembayaran Gagal",
    bgColor: "bg-red-50",
    textColor: "text-red-700",
    borderColor: "border-red-200",
    dotColor: "bg-red-500",
  },
  expired: {
    label: "Kadaluarsa",
    bgColor: "bg-rose-50",
    textColor: "text-rose-700",
    borderColor: "border-rose-200",
    dotColor: "bg-rose-500",
  },
};

const fulfillmentConfig: Record<
  FulfillmentStatus,
  {
    label: string;
    desc: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
    dotColor: string;
  }
> = {
  received: {
    label: "Order Diterima",
    desc: "Pesanan kamu sudah masuk sistem dan akan segera diproses.",
    bgColor: "bg-sky-50",
    textColor: "text-sky-700",
    borderColor: "border-sky-200",
    dotColor: "bg-sky-500",
  },
  preparing: {
    label: "Sedang Dibuat",
    desc: "Tim kami sedang menyiapkan pesanan kamu.",
    bgColor: "bg-indigo-50",
    textColor: "text-indigo-700",
    borderColor: "border-indigo-200",
    dotColor: "bg-indigo-500",
  },
  served: {
    label: "Siap / Diserahkan",
    desc: "Pesanan kamu sudah siap dan sedang/baru saja diserahkan.",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-200",
    dotColor: "bg-emerald-500",
  },
  completed: {
    label: "Selesai",
    desc: "Pesanan kamu sudah selesai. Terima kasih!",
    bgColor: "bg-slate-50",
    textColor: "text-slate-700",
    borderColor: "border-slate-200",
    dotColor: "bg-slate-500",
  },
};

function formatDateTimeID(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default async function NotaPage({ params }: { params: Promise<Params> }) {
  const { orderNumber } = await params;

  const { data: order, error: orderErr } = await supabaseServer
    .from("orders")
    .select(
      "id, order_number, total_amount, payment_status, payment_method, fulfillment_status, created_at, completed_at, tables(table_number)"
    )
    .eq("order_number", orderNumber)
    .single<OrderWithTable>();

  if (orderErr || !order) return notFound();

  const { data: items } = await supabaseServer
    .from("order_items")
    .select("id, menu_item_id, quantity, price, subtotal, notes, menu_items(name)")
    .eq("order_id", order.id)
    .returns<OrderItemWithMenu[]>();

  const tableNumber = order.tables?.table_number ?? null;

  const isCash = order.payment_method === "cash";
  const isCashPending = isCash && order.payment_status === "pending";

  const payUI = paymentConfig[order.payment_status];
  const prodUI = fulfillmentConfig[order.fulfillment_status];

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background pointer-events-none" />

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8 text-center sm:text-left">
          <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full mb-4">
            NOTA DIGITAL
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-3 text-balance">
            Terima Kasih 🎉
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Pesanan Anda sudah tercatat. Kamu bisa cek status pembayaran & status pesanan di sini.
          </p>
        </div>

        {/* Cash pending alert */}
        {isCashPending && (
          <Card className="p-5 sm:p-6 mb-6 border border-border bg-amber-50/50 backdrop-blur-sm">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex-shrink-0 flex items-center justify-center">
                <div className="text-lg font-bold text-amber-700">!</div>
              </div>
              <div className="flex-1">
                <div className="font-semibold text-amber-900">
                  Menunggu Pembayaran Tunai
                </div>
                <div className="text-sm text-amber-800 mt-1">
                  Silakan bayar ke kasir dengan nomor order:{" "}
                  <span className="font-mono font-bold text-base">
                    {order.order_number}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Main card */}
        <Card className="p-6 sm:p-8 space-y-6 border border-border shadow-sm">
          {/* Status Produksi */}
          <div
            className={`flex items-start gap-4 p-5 rounded-lg ${prodUI.bgColor} border ${prodUI.borderColor}`}
          >
            <div
              className={`w-3 h-3 rounded-full ${prodUI.dotColor} mt-1 flex-shrink-0`}
            />
            <div className="flex-1">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Status Pesanan
              </div>
              <div className={`text-lg font-bold ${prodUI.textColor} mt-1`}>
                {prodUI.label}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {prodUI.desc}
              </div>
            </div>
          </div>

          {/* Status Pembayaran */}
          <div
            className={`flex items-center gap-4 p-5 rounded-lg ${payUI.bgColor} border ${payUI.borderColor}`}
          >
            <div
              className={`w-3 h-3 rounded-full ${payUI.dotColor} flex-shrink-0`}
            />
            <div className="flex-1">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Status Pembayaran
              </div>
              <div className={`text-lg font-bold ${payUI.textColor} mt-1`}>
                {payUI.label}
              </div>
            </div>
          </div>

          {/* Order number */}
          <div className="bg-muted/50 p-5 sm:p-6 rounded-lg border border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
              Nomor Order
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-primary font-mono tracking-tight">
              {order.order_number}
            </div>
          </div>

          <Separator />

          {/* Details */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Nomor Meja
              </div>
              <div className="text-2xl font-bold text-foreground">
                {tableNumber ?? "-"}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Metode Pembayaran
              </div>
              <div className="text-base sm:text-lg font-semibold text-foreground capitalize">
                {order.payment_method === "cash"
                  ? "Tunai"
                  : order.payment_method || "Online"}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Waktu Pesan
              </div>
              <div className="text-sm font-semibold text-foreground">
                {formatDateTimeID(order.created_at)}
              </div>
            </div>

            {order.completed_at && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Selesai
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {formatDateTimeID(order.completed_at)}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Items */}
          <div className="space-y-4">
            <div className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
              Detail Pesanan
            </div>

            <div className="space-y-3">
              {(items ?? []).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Tidak ada item dalam pesanan ini
                </div>
              ) : (
                (items ?? []).map((it) => (
                  <div
                    key={it.id}
                    className="flex items-start justify-between gap-4 pb-4 border-b border-muted last:border-0 last:pb-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground text-sm sm:text-base">
                        {it.menu_items?.name ?? it.menu_item_id}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {it.quantity}x {formatRupiah(it.price)}
                      </div>
                      {it.notes && (
                        <div className="text-xs text-muted-foreground mt-2 italic bg-muted/50 p-2 rounded">
                          Catatan: {it.notes}
                        </div>
                      )}
                    </div>

                    <div className="text-sm sm:text-base font-bold text-primary text-right whitespace-nowrap">
                      {formatRupiah(it.subtotal)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <Separator />

          {/* Total */}
          <div className="bg-primary/10 p-5 sm:p-6 rounded-lg border border-primary/20">
            <div className="flex items-baseline justify-between">
              <span className="text-base sm:text-lg font-bold text-muted-foreground uppercase tracking-wide">
                Total
              </span>
              <span className="text-3xl sm:text-4xl font-bold text-primary">
                {formatRupiah(order.total_amount)}
              </span>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
          <Link href="/menu" className="block">
            <Button className="w-full font-semibold h-11 text-base" size="lg">
              🛒 Pesan Lagi
            </Button>
          </Link>

          <RefreshButton />
        </div>

        <Link href="/" className="block text-center py-4">
          <p className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Kembali ke Beranda
          </p>
        </Link>
      </div>
    </main>
  );
}
