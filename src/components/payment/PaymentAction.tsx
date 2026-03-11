import { Button } from "@/components/ui/button";
import { CreditCard, ShieldCheck } from "lucide-react";
import type { PaymentMethod } from "@/hooks/usePaymentLogic";

interface Props {
  loading: boolean;
  disabled: boolean;
  method: PaymentMethod;
  onPay: () => void;
}

export function PaymentAction({ loading, disabled, method, onPay }: Props) {
  return (
    <div className="space-y-4 mt-4">
      <Button
        onClick={onPay}
        disabled={disabled}
        className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-primary to-primary/90 py-6 text-base font-bold shadow-lg hover:shadow-primary/25 transition-all active:scale-[0.98]"
      >
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
        <div className="relative flex items-center justify-center gap-2">
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
              <span>Memproses...</span>
            </>
          ) : (
            <>
              <span>{method === "online" ? "Bayar via Mayar-ID" : "Buat Pesanan"}</span>
              <CreditCard className="h-4 w-4" />
            </>
          )}
        </div>
      </Button>

      <div className="flex items-center justify-center gap-1.5 opacity-60">
        <ShieldCheck className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] font-medium text-muted-foreground">
          Pembayaran Aman & Terenkripsi
        </span>
      </div>
    </div>
  );
}