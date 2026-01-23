"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
  selectedTable: { id: string; table_number: number };
  cart: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    notes?: string;
  }>;
  onBack: () => void;
}

export function StepOrderConfirmation({ selectedTable, cart, onBack }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "midtrans">("cash");

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

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
          notes: item.notes || null,
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

      // Handle based on payment method
      if (paymentMethod === "cash") {
        // Cash payment - order created, pending confirmation
        toast.success("Order berhasil dibuat! Menunggu konfirmasi pembayaran tunai.");
        router.push("/admin/kasir");
      } else if (paymentMethod === "midtrans") {
        // Midtrans payment - redirect to payment page
        if (data.midtrans_redirect_url) {
          toast.success("Order berhasil dibuat! Redirect ke halaman pembayaran...");
          
          // Option 1: Redirect in same tab
          // window.location.href = data.midtrans_redirect_url;
          
          // Option 2: Open in new tab (recommended untuk kasir)
          const paymentWindow = window.open(
            data.midtrans_redirect_url,
            "_blank",
            "width=600,height=800"
          );

          if (paymentWindow) {
            toast.info("Halaman pembayaran dibuka di tab baru");
            
            // Redirect kasir back to dashboard
            setTimeout(() => {
              router.push("/admin/kasir");
            }, 1000);
          } else {
            // Popup blocked, fallback to same tab
            toast.warning("Popup blocked. Redirect di tab ini...");
            window.location.href = data.midtrans_redirect_url;
          }
        } else {
          throw new Error("Payment link not available");
        }
      }
    } catch (error) {
      console.error("Submit order error:", error);
      toast.error(error instanceof Error ? error.message : "Gagal membuat order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Konfirmasi Order</h2>
        
        {/* Order Summary */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Meja:</span>
            <span className="font-medium">Meja {selectedTable.table_number}</span>
          </div>

          <div className="border-t pt-4 space-y-2">
            <h3 className="font-semibold text-sm">Items:</h3>
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.quantity}x {item.name}
                </span>
                <span>Rp {(item.price * item.quantity).toLocaleString("id-ID")}</span>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 flex justify-between font-bold text-lg">
            <span>Total:</span>
            <span>Rp {subtotal.toLocaleString("id-ID")}</span>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="space-y-3 mb-6">
          <h3 className="font-semibold">Metode Pembayaran:</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod("cash")}
              className={`p-4 border-2 rounded-lg transition-all ${
                paymentMethod === "cash"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="text-2xl mb-2">💵</div>
              <div className="font-semibold">Tunai</div>
              <div className="text-xs text-muted-foreground">
                Bayar di kasir
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod("midtrans")}
              className={`p-4 border-2 rounded-lg transition-all ${
                paymentMethod === "midtrans"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="text-2xl mb-2">📱</div>
              <div className="font-semibold">QRIS</div>
              <div className="text-xs text-muted-foreground">
                Scan untuk bayar
              </div>
            </button>
          </div>
        </div>

        {/* Payment Method Description */}
        <div className="bg-muted/50 p-4 rounded-lg mb-6 text-sm">
          {paymentMethod === "cash" ? (
            <>
              <div className="font-semibold mb-1">Pembayaran Tunai</div>
              <div className="text-muted-foreground">
                Order akan dibuat dengan status `Pending`. Konfirmasi pembayaran setelah customer membayar tunai.
              </div>
            </>
          ) : (
            <>
              <div className="font-semibold mb-1">Pembayaran QRIS (Midtrans)</div>
              <div className="text-muted-foreground">
                Link pembayaran akan dibuka otomatis. Customer scan QR code untuk membayar.
                Status order akan otomatis update setelah pembayaran berhasil.
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
            className="flex-1"
          >
            Kembali
          </Button>
          
          <Button
            onClick={handleSubmitOrder}
            disabled={isSubmitting}
            className="flex-1"
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