"use client";

// src/hooks/usePaymentLogic.ts
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCartStore } from "@/store/cartStore";

export type PaymentMethod = "online" | "cash";

interface MayarApiResponse {
  message?: string;
  orderNumber?: string;
  paymentUrl?: string;
  transactionId?: string;
}

interface CashApiResponse {
  message?: string;
  order?: { order_number: string };
  orderNumber?: string;
}

export function usePaymentLogic() {
  const router = useRouter();

  const items = useCartStore((s) => s.items);
  const tableNumber = useCartStore((s) => s.tableNumber);
  const clearCart = useCartStore((s) => s.clearCart);
  const total = useCartStore((s) => s.getTotalAmount());

  const [method, setMethod] = useState<PaymentMethod>("online");
  const [loading, setLoading] = useState(false);

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

  const handleBack = () => router.back();

  // ─── Mayar (online) ────────────────────────────────────────────────────────
  const processMayar = async (voucherCode?: string) => {
    if (!items.length) throw new Error("Keranjang kosong.");
    if (!tableNumber) throw new Error("Nomor meja tidak ditemukan.");

    const res = await fetch("/api/mayar/create-transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableNumber, items: payloadItems, voucherCode }),
    });

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      throw new Error("Server error: response bukan JSON.");
    }

    const data = (await res.json()) as MayarApiResponse;

    if (!res.ok) {
      throw new Error(data.message ?? "Gagal membuat transaksi.");
    }

    if (!data.paymentUrl) {
      throw new Error("Payment URL tidak diterima dari server.");
    }

    clearCart();
    // Redirect ke halaman checkout Mayar
    window.location.href = data.paymentUrl;
  };

  // ─── Cash ──────────────────────────────────────────────────────────────────
  const processCash = async (voucherCode?: string) => {
    if (!items.length) throw new Error("Keranjang kosong.");
    if (!tableNumber) throw new Error("Nomor meja tidak ditemukan.");

    const res = await fetch("/api/orders/cash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableNumber, items: payloadItems, voucherCode }),
    });

    const data = (await res.json()) as CashApiResponse;

    if (!res.ok) {
      throw new Error(data.message ?? "Gagal membuat order cash.");
    }

    const orderNumber = data.order?.order_number ?? data.orderNumber;
    if (!orderNumber) throw new Error("Order number tidak diterima.");

    clearCart();
    router.push(`/nota/${orderNumber}`);
  };

  // ─── Main handler ──────────────────────────────────────────────────────────
  const handlePay = async (voucherCode?: string) => {
    setLoading(true);
    try {
      if (method === "online") await processMayar(voucherCode);
      else await processCash(voucherCode);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Terjadi kesalahan.");
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
    handleBack,
    handlePay,
  };
}