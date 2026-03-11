"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, MessageSquare, Receipt } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import type { Table, CartItem } from "@/types/manual-order";

interface Props {
  selectedTable: Table;
  cart: CartItem[];
  onBack: () => void;
}

export function StepOrderConfirmation({ selectedTable, cart, onBack }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "online">("cash");

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const handleSubmitOrder = async () => {
    setIsSubmitting(true);

    try {
      const payload = {
        table_id: selectedTable.id,
        table_number: selectedTable.table_number,
        payment_method: paymentMethod,
        customer_name: `Meja ${selectedTable.table_number}`,
        items: cart.map((item) => ({
          menu_id: item.id,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes || "",
        })),
      };

      const res = await fetch("/api/admin/orders/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal membuat order");
      }

      // ─── Cash ──────────────────────────────────────────────────────────────
      if (paymentMethod === "cash") {
        toast.success("Order berhasil dibuat! Menunggu konfirmasi pembayaran tunai.");
        router.push("/admin/kasir");

      // ─── Online (Mayar) ────────────────────────────────────────────────────
      } else if (paymentMethod === "online") {
        if (data.payment_url) {
          toast.success("Order berhasil dibuat! Membuka halaman pembayaran...");

          const paymentWindow = window.open(
            data.payment_url,
            "_blank",
            "width=600,height=800",
          );

          if (paymentWindow) {
            toast.info("Halaman pembayaran Mayar dibuka di tab baru");
            setTimeout(() => {
              router.push("/admin/kasir");
            }, 1000);
          } else {
            toast.warning("Popup blocked. Redirect di tab ini...");
            window.location.href = data.payment_url;
          }
        } else {
          throw new Error("Payment link tidak tersedia");
        }
      }

      // ─── Midtrans (dinonaktifkan, diganti Mayar) ───────────────────────────
      // } else if (paymentMethod === "midtrans") {
      //   if (data.midtrans_redirect_url) {
      //     toast.success("Order berhasil dibuat! Redirect ke halaman pembayaran...");
      //     const paymentWindow = window.open(
      //       data.midtrans_redirect_url,
      //       "_blank",
      //       "width=600,height=800",
      //     );
      //     if (paymentWindow) {
      //       toast.info("Halaman pembayaran dibuka di tab baru");
      //       setTimeout(() => { router.push("/admin/kasir"); }, 1000);
      //     } else {
      //       toast.warning("Popup blocked. Redirect di tab ini...");
      //       window.location.href = data.midtrans_redirect_url;
      //     }
      //   } else {
      //     throw new Error("Payment link not available");
      //   }
      // }

    } catch (error) {
      console.error("Submit order error:", error);
      toast.error(
        error instanceof Error ? error.message : "Gagal membuat order",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Receipt className="w-6 h-6 text-amber-600" />
          Konfirmasi Order
        </h2>

        {/* Order Summary */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-between text-sm p-3 bg-amber-50 rounded-lg border border-amber-200">
            <span className="text-muted-foreground font-medium">Meja:</span>
            <span className="font-bold text-amber-900">
              Meja {selectedTable.table_number}
            </span>
          </div>

          <div className="border-t pt-4 space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Detail Pesanan:
            </h3>
            {cart.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-muted/30 rounded-lg border border-border/50"
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-sm">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="font-semibold text-sm text-amber-700">
                        {formatRupiah(item.price * item.quantity)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatRupiah(item.price)} per porsi
                    </p>
                  </div>
                </div>

                {item.notes && (
                  <div className="mt-2 flex items-start gap-2 text-xs bg-amber-50 text-amber-800 p-2 rounded border border-amber-200">
                    <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold">Catatan:</span>
                      <p className="mt-0.5">{item.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t-2 border-amber-200 pt-4 flex justify-between items-center bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg">
            <span className="font-bold text-lg">Total Pembayaran:</span>
            <span className="font-bold text-2xl text-amber-700">
              {formatRupiah(subtotal)}
            </span>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="space-y-3 mb-6">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Metode Pembayaran:
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod("cash")}
              className={`p-4 border-2 rounded-lg transition-all ${
                paymentMethod === "cash"
                  ? "border-amber-600 bg-amber-50 shadow-md"
                  : "border-border hover:border-amber-300 bg-white"
              }`}
            >
              <div className="text-3xl mb-2">💵</div>
              <div className="font-semibold">Tunai</div>
              <div className="text-xs text-muted-foreground mt-1">
                Bayar di kasir
              </div>
            </button>

            {/* Online (Mayar) */}
            <button
              type="button"
              onClick={() => setPaymentMethod("online")}
              className={`p-4 border-2 rounded-lg transition-all ${
                paymentMethod === "online"
                  ? "border-amber-600 bg-amber-50 shadow-md"
                  : "border-border hover:border-amber-300 bg-white"
              }`}
            >
              <div className="text-3xl mb-2">📱</div>
              <div className="font-semibold">QRIS</div>
              <div className="text-xs text-muted-foreground mt-1">
                Scan untuk bayar
              </div>
            </button>

            {/* Midtrans (dinonaktifkan) */}
            {/* <button
              type="button"
              onClick={() => setPaymentMethod("midtrans")}
              className={`p-4 border-2 rounded-lg transition-all ${
                paymentMethod === "midtrans"
                  ? "border-amber-600 bg-amber-50 shadow-md"
                  : "border-border hover:border-amber-300 bg-white"
              }`}
            >
              <div className="text-3xl mb-2">📱</div>
              <div className="font-semibold">QRIS (Midtrans)</div>
              <div className="text-xs text-muted-foreground mt-1">
                Scan untuk bayar
              </div>
            </button> */}
          </div>
        </div>

        {/* Payment Method Description */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6 text-sm">
          {paymentMethod === "cash" ? (
            <>
              <div className="font-semibold mb-1 text-blue-900">
                💡 Pembayaran Tunai
              </div>
              <div className="text-blue-800">
                Order akan dibuat dengan status{" "}
                <span className="font-semibold">Pending</span>. Konfirmasi
                pembayaran setelah customer membayar tunai di kasir.
              </div>
            </>
          ) : (
            <>
              <div className="font-semibold mb-1 text-blue-900">
                💡 Pembayaran QRIS (Mayar)
              </div>
              <div className="text-blue-800">
                Link pembayaran Mayar akan dibuka otomatis. Customer scan QR
                code untuk membayar. Status order akan otomatis update setelah
                pembayaran berhasil.
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting}
            className="flex-1 h-12"
          >
            Kembali
          </Button>

          <Button
            onClick={handleSubmitOrder}
            disabled={isSubmitting}
            className="flex-1 h-12 bg-amber-700 hover:bg-amber-800 text-white shadow-md"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Memproses...
              </>
            ) : (
              "Buat Order"
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}