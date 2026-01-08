"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Receipt } from "lucide-react";
import { usePaymentLogic } from "@/hooks/usePaymentLogic";
import BackgroundDecorations from "@/components/shared/BackgroundDecorations";
import { PaymentHeader } from "@/components/payment/PaymentHeader";
import { PaymentSummary } from "@/components/payment/PaymentSummary";
import { PaymentMethodSelector } from "@/components/payment/PaymentMethodSelector";
import { PaymentAction } from "@/components/payment/PaymentAction";

export default function PembayaranPage() {
  const router = useRouter();
  
  // manggil semua Logic Hook
  const {
    tableNumber,
    items,
    total,
    method,
    setMethod,
    loading,
    snapReady,
    handleBack,
    handlePay,
  } = usePaymentLogic();

  // Redirect State jika belum pilih meja (UI Only)
  if (!tableNumber) {
    return (
      <main className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
        <BackgroundDecorations />
        <div className="relative z-10 p-6 text-center animate-in fade-in zoom-in-95 duration-500">
           <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
             <Receipt className="h-8 w-8" />
           </div>
           <h2 className="text-xl font-bold">Kamu belum memilih meja</h2>
           <p className="mt-2 text-muted-foreground mb-6">Silakan scan QR atau pilih meja terlebih dahulu.</p>
           <Button onClick={() => router.push("/pilih-meja")} className="rounded-full px-8">
             Pilih Meja
           </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden">
      <BackgroundDecorations />

      <div className="relative z-10 mx-auto min-h-screen flex flex-col max-w-md md:max-w-2xl px-4 py-6 md:py-12">
        
        <PaymentHeader onBack={handleBack} />

        <div className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl p-6 shadow-xl shadow-primary/5 space-y-6 md:p-8">
          
          <PaymentSummary tableNumber={tableNumber} total={total} />
          
          <div className="my-2 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
          
          <PaymentMethodSelector 
            method={method} 
            setMethod={setMethod} 
            loading={loading} 
          />
          
          <PaymentAction 
            loading={loading}
            method={method}
            onPay={handlePay}
            disabled={loading || items.length === 0 || (method === "midtrans" && !snapReady)}
          />

        </div>
      </div>
    </main>
  );
}