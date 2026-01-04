// src/app/nota/[orderNumber]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatRupiah } from "@/lib/utils";
import { RefreshButton } from "@/components/RefreshButton";
import { NotaAutoRefresh } from "@/components/NotaAutoRefresh";
import { ShareNotaActions } from "@/components/ShareNotaActions";
import { FulfillmentTimeline } from "@/components/FulfillmentTimeline";

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

  const isPaid = order.payment_status === "paid";
  const isFailed = order.payment_status === "failed" || order.payment_status === "expired";

  // ✅ FIX: kalau completed_at ada, status harus dianggap completed
  const effectiveFulfillmentStatus: FulfillmentStatus =
    order.completed_at ? "completed" : order.fulfillment_status;

  const isCompleted = effectiveFulfillmentStatus === "completed";

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background pointer-events-none" />
      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8 text-center sm:text-left">
          <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full mb-4">
            NOTA DIGITAL
          </span>

          {isCompleted ? (
            <>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-3 text-balance">
                Pesanan Selesai ✨
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground">
                Terima kasih telah memesan. Sampai jumpa lagi!
              </p>
            </>
          ) : isFailed ? (
            <>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-3 text-balance">
                Pembayaran {order.payment_status === "failed" ? "Gagal" : "Kadaluarsa"}
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground">
                Silakan coba lagi atau hubungi staff kami untuk bantuan.
              </p>
              <NotaAutoRefresh
                orderNumber={order.order_number}
                initialPaymentStatus={order.payment_status}
                initialFulfillmentStatus={effectiveFulfillmentStatus}
                intervalMs={3000}
              />
            </>
          ) : isPaid ? (
            <>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-3 text-balance">
                Terima Kasih 🎉
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground">
                Pembayaran sudah kami terima. Pesanan kamu sedang diproses.
              </p>
              {/* ✅ auto refresh fulfillment */}
              <NotaAutoRefresh
                orderNumber={order.order_number}
                initialPaymentStatus={order.payment_status}
                initialFulfillmentStatus={effectiveFulfillmentStatus}
                intervalMs={3000}
              />
            </>
          ) : (
            <>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-3 text-balance">
                Menunggu Pembayaran
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground">
                Pesanan kamu sudah tercatat. Silakan selesaikan pembayaran,
                status akan diperbarui otomatis.
              </p>
              {/* ✅ auto refresh payment */}
              <NotaAutoRefresh
                orderNumber={order.order_number}
                initialPaymentStatus={order.payment_status}
                initialFulfillmentStatus={effectiveFulfillmentStatus}
                intervalMs={3000}
              />
            </>
          )}
        </div>

        {/* Cash pending alert */}
        {isCashPending && (
          <Card className="p-5 sm:p-6 mb-6 border border-border bg-amber-50/50 backdrop-blur-sm">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex-shrink-0 flex items-center justify-center">
                <div className="text-lg font-bold text-amber-700">!</div>
              </div>
              <div className="flex-1">
                <div className="font-semibold text-amber-900">Menunggu Pembayaran Tunai</div>
                <div className="text-sm text-amber-800 mt-1">
                  Silakan bayar ke kasir dengan nomor order:{" "}
                  <span className="font-mono font-bold text-base">{order.order_number}</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6 sm:p-8 space-y-6 border border-border shadow-sm">
          {/* Timeline only if paid */}
          {isPaid && (
            <div className="mb-2">
              <FulfillmentTimeline currentStatus={effectiveFulfillmentStatus} />
            </div>
          )}

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
              <div className="text-2xl font-bold text-foreground">{tableNumber ?? "-"}</div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Metode Pembayaran
              </div>
              <div className="text-base sm:text-lg font-semibold text-foreground capitalize">
                {order.payment_method === "cash" ? "Tunai" : order.payment_method || "Online"}
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
                <div className="text-center py-8 text-muted-foreground">Tidak ada item.</div>
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

        {/* Share only if paid */}
        {isPaid && (
          <ShareNotaActions
            orderNumber={order.order_number}
            tableNumber={tableNumber}
            totalAmount={order.total_amount}
          />
        )}
      </div>
    </main>
  );
}
