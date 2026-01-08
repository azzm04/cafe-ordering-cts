import { formatRupiah } from "@/lib/utils";

export function PaymentSummary({ tableNumber, total }: { tableNumber: number, total: number }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="rounded-2xl bg-muted/50 p-4 border border-border/50">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Meja</span>
        <p className="text-2xl font-bold text-foreground mt-1">#{tableNumber}</p>
      </div>
      <div className="rounded-2xl bg-primary/5 p-4 border border-primary/10">
        <span className="text-xs text-primary/80 font-medium uppercase tracking-wider">Total</span>
        <p className="text-xl sm:text-2xl font-black text-primary mt-1 break-words leading-tight">
          {formatRupiah(total)}
        </p>
      </div>
    </div>
  );
}