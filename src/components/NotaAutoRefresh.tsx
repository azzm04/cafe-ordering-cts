// src/components/NotaAutoRefresh.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type PaymentStatus = "pending" | "paid" | "failed" | "expired";
type FulfillmentStatus = "received" | "preparing" | "served" | "completed";

type Props = {
  orderNumber: string;
  initialPaymentStatus: PaymentStatus;
  initialFulfillmentStatus: FulfillmentStatus;
  intervalMs?: number;
};

type StatusResponse = {
  orderNumber: string;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
  completed_at: string | null;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatTimeHHmmss(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

function isFinal(payment: PaymentStatus, fulfillment: FulfillmentStatus) {
  if (payment === "failed" || payment === "expired") return true;
  if (fulfillment === "completed") return true;
  return false;
}

export function NotaAutoRefresh({
  orderNumber,
  initialPaymentStatus,
  initialFulfillmentStatus,
  intervalMs = 3000,
}: Props) {
  const router = useRouter();

  const [payment, setPayment] = useState<PaymentStatus>(initialPaymentStatus);
  const [fulfillment, setFulfillment] = useState<FulfillmentStatus>(
    initialFulfillmentStatus
  );
  const [lastCheck, setLastCheck] = useState<string>(() =>
    formatTimeHHmmss(new Date())
  );

  const stopped = useMemo(() => isFinal(payment, fulfillment), [payment, fulfillment]);

  const timerRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // kalau sudah final, stop polling
    if (stopped) return;

    const tick = async () => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      try {
        const res = await fetch(
          `/api/orders/status?orderNumber=${encodeURIComponent(orderNumber)}`,
          {
            method: "GET",
            cache: "no-store",
            signal: abortRef.current.signal,
          }
        );

        if (!res.ok) {
          // kalau error sementara, biarkan next tick coba lagi
          setLastCheck(formatTimeHHmmss(new Date()));
          return;
        }

        const json = (await res.json()) as StatusResponse;

        setPayment(json.payment_status);
        setFulfillment(json.fulfillment_status);
        setLastCheck(formatTimeHHmmss(new Date()));

        // ✅ kalau ada perubahan, refresh Server Component page agar UI update
        // (router.refresh aman dipanggil tiap tick juga, tapi ini lebih hemat)
        if (
          json.payment_status !== payment ||
          json.fulfillment_status !== fulfillment
        ) {
          router.refresh();
        }

        // ✅ kalau sudah final setelah update, hentikan
        if (isFinal(json.payment_status, json.fulfillment_status)) {
          return;
        }
      } catch {
        setLastCheck(formatTimeHHmmss(new Date()));
      }
    };

    // tick pertama
    void tick();

    timerRef.current = window.setInterval(() => {
      void tick();
    }, intervalMs);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
      abortRef.current?.abort();
      abortRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNumber, intervalMs, stopped]);

  return (
    <div className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
      <span
        className={`inline-block w-2 h-2 rounded-full ${
          stopped ? "bg-muted-foreground/40" : "bg-emerald-500"
        }`}
      />
      <span>
        {stopped ? "Auto refresh berhenti" : "Auto refresh aktif"} · cek terakhir{" "}
        {lastCheck}
      </span>
    </div>
  );
}
