"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type PaymentStatus = "pending" | "paid" | "failed" | "expired";

type Props = {
  /** Nomor order, buat polling endpoint */
  orderNumber: string;
  /** Status sekarang dari server */
  initialStatus: PaymentStatus;
  /** interval polling dalam ms */
  intervalMs?: number;
};

type StatusResponse =
  | { ok: true; payment_status: PaymentStatus }
  | { ok: false; message: string };

function isPaymentStatus(v: unknown): v is PaymentStatus {
  return v === "pending" || v === "paid" || v === "failed" || v === "expired";
}

export function NotaAutoRefresh({
  orderNumber,
  initialStatus,
  intervalMs = 4000,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<PaymentStatus>(initialStatus);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    // kalau sudah paid/failed/expired, stop polling
    if (status !== "pending") return;

    let stopped = false;

    const tick = async () => {
      try {
        const res = await fetch(
          `/api/orders/status?order_number=${encodeURIComponent(orderNumber)}`,
          { cache: "no-store" }
        );

        const json: unknown = await res.json();
        if (!res.ok) return;

        const data = json as StatusResponse;
        if (!("ok" in data) || data.ok !== true) return;

        if (!isPaymentStatus(data.payment_status)) return;

        if (stopped) return;

        if (data.payment_status !== status) {
          setStatus(data.payment_status);

          // kalau sudah paid -> refresh server component agar UI berubah
          router.refresh();
        }
      } catch {
        // swallow error (offline dll)
      }
    };

    timerRef.current = window.setInterval(tick, intervalMs);

    // juga lakukan cek cepat sekali saat mount
    tick().catch(() => {});

    return () => {
      stopped = true;
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [orderNumber, intervalMs, router, status]);

  // Optional: tampilkan indikator kecil kalau polling aktif
  if (status !== "pending") return null;

  return (
    <p className="text-xs text-muted-foreground mt-2">
      ⏳ Mengecek status pembayaran otomatis...
    </p>
  );
}
