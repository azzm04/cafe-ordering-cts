"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCartStore } from "@/store/cartStore";
import { useMidtransSnap } from "@/hooks/useMidtransSnap";
import { useOrder } from "@/hooks/useOrder";

export type PaymentMethod = "midtrans" | "cash";

export function usePaymentLogic() {
  const router = useRouter();
  const { snapReady } = useMidtransSnap();
  const { createTransaction } = useOrder();

  // Store Data
  const items = useCartStore((s) => s.items);
  const tableNumber = useCartStore((s) => s.tableNumber);
  const clearCart = useCartStore((s) => s.clearCart);
  const total = useCartStore((s) => s.getTotalAmount());

  // Local State
  const [method, setMethod] = useState<PaymentMethod>("midtrans");
  const [loading, setLoading] = useState(false);

  // Payload Preparation
  const payloadItems = useMemo(
    () =>
      items.map((it) => ({
        menu_item_id: it.id,
        name: it.name,
        quantity: it.quantity,
        price: it.price,
        notes: it.notes,
      })),
    [items]
  );

  // Actions
  const handleBack = () => router.back();

  const processMidtrans = async (voucherCode?: string) => {
    if (!snapReady)
      throw new Error("Midtrans Snap belum siap. Refresh halaman.");
    if (items.length === 0) throw new Error("Keranjang kosong.");
    if (!tableNumber) throw new Error("Nomor meja hilang.");

    const { orderNumber, snapToken } = await createTransaction({
      tableNumber,
      items: payloadItems,
      voucherCode,
    });

    window.snap.pay(snapToken, {
      onSuccess: () => {
        clearCart();
        router.push(`/nota/${orderNumber}`);
      },
      onPending: () => router.push(`/nota/${orderNumber}`),
      onError: () => router.push(`/nota/${orderNumber}`),
      onClose: () => router.push(`/nota/${orderNumber}`),
    });
  };

  const processCash = async (voucherCode?: string) => {
    if (items.length === 0) throw new Error("Keranjang kosong.");
    if (!tableNumber) throw new Error("Nomor meja hilang.");

    const res = await fetch("/api/orders/cash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tableNumber,
        items: payloadItems,
        voucherCode,
      }),
    });

    const json: unknown = await res.json();

    if (!res.ok) {
      const msg =
        typeof json === "object" && json !== null && "message" in json
          ? String((json as Record<string, unknown>).message)
          : "Gagal membuat order cash";
      throw new Error(msg);
    }

    const orderNumber =
      typeof json === "object" && json !== null && "orderNumber" in json
        ? (json as Record<string, unknown>).orderNumber
        : null;

    if (typeof orderNumber !== "string")
      throw new Error("Invalid response: orderNumber missing");

    clearCart();
    router.push(`/nota/${orderNumber}`);
  };

  const handlePay = async (voucherCode?: string) => {
    setLoading(true);
    try {
      if (method === "midtrans") await processMidtrans(voucherCode);
      else await processCash(voucherCode);
    } catch (e: unknown) {
      let errorMessage = "Terjadi kesalahan";

      if (e instanceof Error) {
        errorMessage = e.message;
      } else if (typeof e === "string") {
        errorMessage = e;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    tableNumber,
    items,
    total,
    method,
    setMethod,
    loading,
    snapReady,
    handleBack,
    handlePay,
  };
}