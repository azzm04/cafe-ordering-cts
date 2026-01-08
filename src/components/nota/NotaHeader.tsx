import { NotaAutoRefresh } from "@/components/NotaAutoRefresh";
import type { FulfillmentStatus, PaymentStatus } from "@/lib/nota/type";

export default function NotaHeader({
  orderNumber,
  paymentStatus,
  effectiveFulfillmentStatus,
}: {
  orderNumber: string;
  paymentStatus: PaymentStatus;
  effectiveFulfillmentStatus: FulfillmentStatus;
}) {
  const isPaid = paymentStatus === "paid";
  const isFailed = paymentStatus === "failed" || paymentStatus === "expired";
  const isCompleted = effectiveFulfillmentStatus === "completed";

  return (
    <div className="mb-6 sm:mb-8 text-center sm:text-left">
      <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-[10px] sm:text-xs font-semibold rounded-full mb-3 sm:mb-4">
        NOTA DIGITAL
      </span>

      {isCompleted ? (
        <>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-2 sm:mb-3 text-balance">
            Pesanan Selesai ✨
          </h1>
          <p className="text-sm sm:text-lg text-muted-foreground">
            Terima kasih telah berkunjung ke Coklat Tepi Sawah.
          </p>
        </>
      ) : isFailed ? (
        <>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-2 sm:mb-3 text-balance">
            Pembayaran {paymentStatus === "failed" ? "Gagal" : "Kadaluarsa"}
          </h1>
          <p className="text-sm sm:text-lg text-muted-foreground mb-4">
            Silakan coba lagi atau hubungi staff kami.
          </p>
          <NotaAutoRefresh
            orderNumber={orderNumber}
            initialPaymentStatus={paymentStatus}
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
            orderNumber={orderNumber}
            initialPaymentStatus={paymentStatus}
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
            orderNumber={orderNumber}
            initialPaymentStatus={paymentStatus}
            initialFulfillmentStatus={effectiveFulfillmentStatus}
            intervalMs={3000}
          />
        </>
      )}
    </div>
  );
}
