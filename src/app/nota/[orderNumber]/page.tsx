// src/app/nota/[orderNumber]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatRupiah } from "@/lib/utils";
// RefreshButton dihapus
import { NotaAutoRefresh } from "@/components/NotaAutoRefresh";
import { ShareNotaActions } from "@/components/ShareNotaActions";
import { FulfillmentTimeline } from "@/components/FulfillmentTimeline";
import { ContinuePaymentButton } from "@/components/ContinuePaymentButton";

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

export default async function NotaPage({
  params,
}: {
  params: Promise<Params>;
}) {
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
    .select(
      "id, menu_item_id, quantity, price, subtotal, notes, menu_items(name)"
    )
    .eq("order_id", order.id)
    .returns<OrderItemWithMenu[]>();

  const tableNumber = order.tables?.table_number ?? null;

  const isCash = order.payment_method === "cash";
  const isCashPending = isCash && order.payment_status === "pending";

  const isPaid = order.payment_status === "paid";
  const isFailed =
    order.payment_status === "failed" || order.payment_status === "expired";

  const effectiveFulfillmentStatus: FulfillmentStatus = order.completed_at
    ? "completed"
    : order.fulfillment_status;

  const isCompleted = effectiveFulfillmentStatus === "completed";

  return (
    // PADDING diperkecil di mobile (p-4) agar muat lebih banyak konten
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8 pb-20">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background pointer-events-none" />
      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-6 sm:mb-8 text-center sm:text-left">
          <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-[10px] sm:text-xs font-semibold rounded-full mb-3 sm:mb-4">
            NOTA DIGITAL
          </span>

          {isCompleted ? (
            <>
              {/* Ukuran font responsive: text-2xl di mobile */}
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-2 sm:mb-3 text-balance">
                Pesanan Selesai ✨
              </h1>
              <p className="text-sm sm:text-lg text-muted-foreground">
                Terima kasih telah memesan di Cokalt Tepi Sawah.
              </p>
            </>
          ) : isFailed ? (
            <>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-2 sm:mb-3 text-balance">
                Pembayaran{" "}
                {order.payment_status === "failed" ? "Gagal" : "Kadaluarsa"}
              </h1>
              <p className="text-sm sm:text-lg text-muted-foreground mb-4">
                Silakan coba lagi atau hubungi staff kami.
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
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-2 sm:mb-3 text-balance">
                Terima Kasih 🎉
              </h1>
              <p className="text-sm sm:text-lg text-muted-foreground mb-2">
                Pembayaran diterima. Pesanan sedang diproses.
              </p>
              <NotaAutoRefresh
                orderNumber={order.order_number}
                initialPaymentStatus={order.payment_status}
                initialFulfillmentStatus={effectiveFulfillmentStatus}
                intervalMs={3000}
              />
            </>
          ) : (
            <>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-2 sm:mb-3 text-balance">
                Menunggu Pembayaran
              </h1>
              <p className="text-sm sm:text-lg text-muted-foreground mb-2">
                Selesaikan pembayaran, status akan update otomatis.
              </p>
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
          <Card className="p-4 sm:p-6 mb-4 sm:mb-6 border border-border bg-amber-50/50 backdrop-blur-sm">
            <div className="flex gap-3 sm:gap-4 items-start">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-100 flex-shrink-0 flex items-center justify-center">
                <div className="text-base sm:text-lg font-bold text-amber-700">
                  !
                </div>
              </div>
              <div className="flex-1">
                <div className="font-semibold text-amber-900 text-sm sm:text-base">
                  Menunggu Pembayaran Tunai
                </div>
                <div className="text-xs sm:text-sm text-amber-800 mt-1">
                  Bayar ke kasir dengan Order ID:{" "}
                  <span className="font-mono font-bold block sm:inline mt-1 sm:mt-0">
                    {order.order_number}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-4 sm:p-8 space-y-4 sm:space-y-6 border border-border shadow-sm">
          {/* Timeline only if paid */}
          {isPaid && (
            <div className="mb-0 sm:mb-2">
              <FulfillmentTimeline currentStatus={effectiveFulfillmentStatus} />
            </div>
          )}

          {/* Order number Box */}
          <div className="bg-muted/50 p-4 sm:p-6 rounded-lg border border-border">
            <div className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1 sm:mb-2">
              Nomor Order
            </div>
            <div className="text-2xl sm:text-4xl font-bold text-primary font-mono tracking-tight break-all">
              {order.order_number}
            </div>
          </div>

          <Separator />

          {/* Details Grid - Gap diperkecil */}
          <div className="grid grid-cols-2 gap-3 sm:gap-6">
            <div className="space-y-1 sm:space-y-2">
              <div className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Nomor Meja
              </div>
              <div className="text-xl sm:text-2xl font-bold text-foreground">
                {tableNumber ?? "-"}
              </div>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <div className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Pembayaran
              </div>
              <div className="text-sm sm:text-lg font-semibold text-foreground capitalize truncate">
                {order.payment_method === "cash"
                  ? "Tunai"
                  : order.payment_method || "Online"}
              </div>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <div className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Waktu Pesan
              </div>
              <div className="text-xs sm:text-sm font-semibold text-foreground">
                {formatDateTimeID(order.created_at)}
              </div>
            </div>

            {order.completed_at && (
              <div className="space-y-1 sm:space-y-2">
                <div className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Selesai
                </div>
                <div className="text-xs sm:text-sm font-semibold text-foreground">
                  {formatDateTimeID(order.completed_at)}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Items List */}
          <div className="space-y-3 sm:space-y-4">
            <div className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-wide">
              Detail Pesanan
            </div>

            <div className="space-y-3">
              {(items ?? []).length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  Tidak ada item.
                </div>
              ) : (
                (items ?? []).map((it) => (
                  <div
                    key={it.id}
                    className="flex items-start justify-between gap-3 pb-3 sm:pb-4 border-b border-muted last:border-0 last:pb-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground text-sm sm:text-base leading-snug">
                        {it.menu_items?.name ?? it.menu_item_id}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        {it.quantity}x {formatRupiah(it.price)}
                      </div>
                      {it.notes && (
                        <div className="text-xs text-muted-foreground mt-1.5 italic bg-muted/50 p-1.5 sm:p-2 rounded border border-border/50">
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
          <div className="bg-primary/10 p-4 sm:p-6 rounded-lg border border-primary/20">
            <div className="flex items-baseline justify-between">
              <span className="text-sm sm:text-lg font-bold text-muted-foreground uppercase tracking-wide">
                Total
              </span>
              <span className="text-2xl sm:text-4xl font-bold text-primary">
                {formatRupiah(order.total_amount)}
              </span>
            </div>
          </div>
        </Card>

        {/* Actions Area - Dibuat Vertikal agar Mobile Friendly */}
        <div className="flex flex-col gap-3 mt-6">
          {/* 1. Tombol Pesan Lagi (Primary Action) */}
          <Link href="/menu" className="w-full">
            <Button
              className="w-full font-bold h-12 text-base shadow-md"
              size="lg"
            >
              🛒 Pesan Lagi
            </Button>
          </Link>

          {/* 2. Tombol Lanjutkan Pembayaran (Jika belum lunas) */}
          {order.payment_status === "pending" &&
            order.payment_method !== "cash" && (
              <ContinuePaymentButton orderNumber={order.order_number} />
            )}

          {/* 3. Tombol Bagikan (Secondary Action) */}
          {/* Tombol Salin Link dihapus, logic copy dimasukkan ke dalam ShareNotaActions jika share API tidak support */}
          {isPaid && (
            <ShareNotaActions
              orderNumber={order.order_number}
              tableNumber={tableNumber}
              totalAmount={order.total_amount}
            />
          )}
        </div>
      </div>
    </main>
  );
}
