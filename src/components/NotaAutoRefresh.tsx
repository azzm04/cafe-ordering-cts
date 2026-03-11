// src/components/NotaAutoRefresh.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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

  const [lastCheck, setLastCheck] = useState<string>("--:--:--");
  
  const [isStopped, setIsStopped] = useState(() => 
    isFinal(initialPaymentStatus, initialFulfillmentStatus)
  );

  const currentStatusRef = useRef({
    payment: initialPaymentStatus,
    fulfillment: initialFulfillmentStatus,
  });

  const checkStatus = useCallback(async () => {
    if (isFinal(currentStatusRef.current.payment, currentStatusRef.current.fulfillment)) {
        setIsStopped(true);
        return;
    }

    try {
      const res = await fetch(
        `/api/orders/status?orderNumber=${encodeURIComponent(orderNumber)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (!res.ok) {
        setLastCheck(formatTimeHHmmss(new Date()));
        return;
      }

      const json = (await res.json()) as StatusResponse;
      setLastCheck(formatTimeHHmmss(new Date()));

      const prev = currentStatusRef.current;
      const hasChanged =
        json.payment_status !== prev.payment ||
        json.fulfillment_status !== prev.fulfillment;

      if (hasChanged) {
        // Update Ref
        currentStatusRef.current = {
          payment: json.payment_status,
          fulfillment: json.fulfillment_status,
        };
        
        if (isFinal(json.payment_status, json.fulfillment_status)) {
            setIsStopped(true);
        }

        // Refresh Server Component agar UI utama update
        router.refresh();
      }
    } catch (error) {
      console.error("Auto refresh error:", error);
      setLastCheck(formatTimeHHmmss(new Date()));
    }
  }, [orderNumber, router]);

  useEffect(() => {
    if (isStopped) return;


    const intervalId = setInterval(() => {
        if (!isStopped) {
            void checkStatus();
        } else {
            clearInterval(intervalId);
        }
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [intervalMs, checkStatus, isStopped]);

  return (
    <div className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
      <span
        className={`inline-block w-2 h-2 rounded-full transition-colors duration-300 ${
          isStopped ? "bg-muted-foreground/40" : "bg-emerald-500 animate-pulse"
        }`}
      />
      <span>
        {isStopped ? "Auto refresh selesai" : "Auto refresh aktif"} · Cek terakhir{" "}
        {lastCheck}
      </span>
    </div>
  );
}