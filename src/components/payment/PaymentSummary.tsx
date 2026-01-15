import { formatRupiah } from "@/lib/utils";

export function PaymentSummary({ 
  tableNumber, 
  subtotal, 
  discount, 
  total 
}: { 
  tableNumber: number; 
  subtotal: number;
  discount: number;
  total: number;
}) {
  return (
    <div className="space-y-4">
      {/* Header Meja */}
      <div className="flex items-center justify-between rounded-2xl bg-muted/50 p-4 border border-border/50">
        <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Meja</span>
        <p className="text-xl font-bold text-foreground">#{tableNumber}</p>
      </div>

      {/* Rincian Harga */}
      <div className="rounded-2xl bg-card border border-border/50 p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">{formatRupiah(subtotal)}</span>
        </div>
        
        {discount > 0 && (
          <div className="flex justify-between text-sm text-emerald-600">
            <span className="font-medium">Diskon Voucher</span>
            <span className="font-bold">- {formatRupiah(discount)}</span>
          </div>
        )}

        <div className="h-px bg-border/50" />

        <div className="flex justify-between items-end">
          <span className="font-bold text-lg">Total Bayar</span>
          <span className="text-2xl font-black text-primary">
            {formatRupiah(total)}
          </span>
        </div>
      </div>
    </div>
  );
}