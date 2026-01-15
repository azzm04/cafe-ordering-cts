// src/hooks/useAutoCancelExpiredOrders.ts
"use client";

import { useEffect, useRef } from "react";

type Options = {
  enabled?: boolean;
  intervalMs?: number;
  onSuccess?: (result: { cancelled: number; orders: string[] }) => void;
  onError?: (error: Error) => void;
};

/**
 * Hook untuk auto-cancel expired cash orders dari client-side
 * Berjalan setiap X menit (default: 15 menit)
 */
export function useAutoCancelExpiredOrders({
  enabled = true,
  intervalMs = 15 * 60 * 1000, // 15 menit
  onSuccess,
  onError,
}: Options = {}) {
  const isRunning = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const checkAndCancel = async () => {
      if (isRunning.current) return;
      
      isRunning.current = true;
      
      try {
        const res = await fetch("/api/admin/orders/auto-cancel-expired", {
          method: "POST",
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${await res.text()}`);
        }

        const data = await res.json();
        
        if (data.cancelled > 0) {
          console.log(`Auto-cancelled ${data.cancelled} expired orders:`, data.orders);
          onSuccess?.(data);
        }
      } catch (error) {
        console.error("Auto-cancel error:", error);
        onError?.(error as Error);
      } finally {
        isRunning.current = false;
      }
    };

    // Run immediately on mount
    void checkAndCancel();

    // Then run periodically
    const intervalId = setInterval(() => {
      void checkAndCancel();
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [enabled, intervalMs, onSuccess, onError]);
}

// Alternative: Manual trigger function
export async function triggerAutoCancelExpiredOrders() {
  const res = await fetch("/api/admin/orders/auto-cancel-expired", {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }

  return res.json();
}