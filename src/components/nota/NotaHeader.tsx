"use client";

import { NotaAutoRefresh } from "@/components/NotaAutoRefresh";
import type { FulfillmentStatus, PaymentStatus } from "@/lib/nota/type";
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Hourglass, 
  ChefHat, 
  UtensilsCrossed 
} from "lucide-react";

export default function NotaHeader({
  orderNumber,
  paymentStatus,
  effectiveFulfillmentStatus,
}: {
  orderNumber: string;
  paymentStatus: PaymentStatus;
  effectiveFulfillmentStatus: FulfillmentStatus;
}) {
  // LOGIC
  const getStatusConfig = () => {
    // Kalau Pembayaran Gagal/Expired
    if (paymentStatus === "failed" || paymentStatus === "expired") {
      return {
        color: "text-red-600 bg-red-100/50 border-red-200",
        icon: <XCircle className="w-10 h-10 sm:w-12 sm:h-12" />,
        title: "Pembayaran Gagal",
        desc: "Maaf, transaksi tidak berhasil. Silakan coba lagi",
        animate: false
      };
    }

    // State ketika sedang Menunggu Pembayaran (Pending)
    if (paymentStatus === "pending") {
      return {
        color: "text-amber-600 bg-amber-100/50 border-amber-200",
        icon: <Hourglass className="w-10 h-10 sm:w-12 sm:h-12 animate-spin-slow" />, // Custom animation class or pulse
        title: "Menunggu Pembayaran",
        desc: "Silahkan menuju ke Kasir untuk membayar pesanan",
        animate: true
      };
    }

    // Kalau Sudah Bayar (Paid) -> Cek Status Fulfillment
    if (effectiveFulfillmentStatus === "received") {
      return {
        color: "text-emerald-600 bg-emerald-100/50 border-emerald-200",
        icon: <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />,
        title: "Pesanan Diterima!",
        desc: "Pembayaran sukses. Pesanan masuk ke dapur",
        animate: true
      };
    }

    // Status: PREPARING (Sedang dibuat)
    if (effectiveFulfillmentStatus === "preparing") {
      return {
        color: "text-blue-600 bg-blue-100/50 border-blue-200",
        icon: <ChefHat className="w-10 h-10 sm:w-12 sm:h-12 animate-bounce-slow" />,
        title: "Sedang Disiapkan",
        desc: "Mohon tunggu, pesanan anda sedang dimasak / siapkan",
        animate: true
      };
    }

    // Status: SERVED (Sudah diantar)
    if (effectiveFulfillmentStatus === "served") {
      return {
        color: "text-orange-600 bg-orange-100/50 border-orange-200",
        icon: <UtensilsCrossed className="w-10 h-10 sm:w-12 sm:h-12" />,
        title: "Selamat Menikmati",
        desc: "Pesanan sudah diantar ke meja Anda",
        animate: false
      };
    }

    // Status: COMPLETED (Selesai)
    return {
      color: "text-primary bg-primary/10 border-primary/20",
      icon: <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />,
      title: "Pesanan Selesai",
      desc: "Terima kasih telah berkunjung",
      animate: false
    };
  };

  const config = getStatusConfig();

  return (
    <div className="flex flex-col items-center text-center space-y-4 mb-8">
      {/* Icon Container with Glow */}
      <div className="relative group">
        <div className={`absolute inset-0 rounded-full blur-xl opacity-20 ${config.color.split(" ")[0].replace("text-", "bg-")}`} />
        <div className={`relative p-4 sm:p-5 rounded-full border-2 shadow-sm transition-all duration-500 ${config.color}`}>
          {config.icon}
        </div>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          {config.title}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-[280px] sm:max-w-md mx-auto leading-relaxed">
          {config.desc}
        </p>
      </div>

      {/* Auto Refresh Logic (Hidden visual, active logic) */}
      {effectiveFulfillmentStatus !== "completed" && paymentStatus !== "failed" && (
        <NotaAutoRefresh
          orderNumber={orderNumber}
          initialPaymentStatus={paymentStatus}
          initialFulfillmentStatus={effectiveFulfillmentStatus}
          intervalMs={3000}
        />
      )}
    </div>
  );
}