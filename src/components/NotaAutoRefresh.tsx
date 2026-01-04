// src/components/NotaAutoRefresh.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type PaymentStatus = "pending" | "paid" | "failed" | "expired";
type FulfillmentStatus = "received" | "preparing" | "served" | "completed";

type StatusResponse = {
  orderNumber: string;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
  completed_at: string | null;
};

type Props = {
  orderNumber: string;
  initialPaymentStatus: PaymentStatus;
  initialFulfillmentStatus: FulfillmentStatus;
  intervalMs?: number;
};

// Helper: cek apakah order sudah final (tidak perlu polling lagi)
function isFinal(payment: PaymentStatus, fulfill: FulfillmentStatus) {
  // Stop polling jika:
  // 1. Payment gagal/expired
  // 2. Order sudah completed
  if (payment === "failed" || payment === "expired") return true;
  if (fulfill === "completed") return true;
  return false;
}

export function NotaAutoRefresh({
  orderNumber,
  initialPaymentStatus,
  initialFulfillmentStatus,
  intervalMs = 3000,
}: Props) {
  const router = useRouter();

  const lastKnown = useRef({
    payment: initialPaymentStatus,
    fulfillment: initialFulfillmentStatus,
  });

  const [active, setActive] = useState(
    !isFinal(initialPaymentStatus, initialFulfillmentStatus)
  );
  
  const [lastCheck, setLastCheck] = useState(() =>
    new Date().toLocaleTimeString("id-ID")
  );

  useEffect(() => {
    if (!active) return;

    let cancelled = false;

    const tick = async () => {
      try {
        const res = await fetch(
          `/api/orders/status?orderNumber=${encodeURIComponent(orderNumber)}`,
          { 
            cache: "no-store",
            next: { revalidate: 0 }
          }
        );

        if (!res.ok) {
          console.warn("Failed to fetch order status:", res.status);
          return;
        }

        const json = (await res.json()) as StatusResponse;

        if (cancelled) return;

        // Update last check time
        setLastCheck(new Date().toLocaleTimeString("id-ID"));

        // Check if anything changed
        const paymentChanged = json.payment_status !== lastKnown.current.payment;
        const fulfillmentChanged = json.fulfillment_status !== lastKnown.current.fulfillment;
        
        const changed = paymentChanged || fulfillmentChanged;

        // Log changes for debugging
        if (paymentChanged) {
          console.log(
            `💳 Payment: ${lastKnown.current.payment} → ${json.payment_status}`
          );
        }
        
        if (fulfillmentChanged) {
          console.log(
            `📦 Fulfillment: ${lastKnown.current.fulfillment} → ${json.fulfillment_status}`
          );
        }

        // Update ref
        lastKnown.current = {
          payment: json.payment_status,
          fulfillment: json.fulfillment_status,
        };

        // Refresh page if changed
        if (changed) {
          console.log("🔄 Refreshing page...");
          router.refresh();
        }

        // Stop polling if final
        if (isFinal(json.payment_status, json.fulfillment_status)) {
          console.log("✅ Order final, stopping auto-refresh");
          setActive(false);
        }
      } catch (error) {
        console.error("Error fetching order status:", error);
      }
    };

    // First check immediately
    tick();

    // Then set interval
    const id = window.setInterval(tick, intervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [active, intervalMs, orderNumber, router]);

  // Don't render anything if not active
  if (!active) return null;

  return (
    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      <span>Auto refresh aktif • cek terakhir {lastCheck}</span>
    </div>
  );
}