"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Receipt, CreditCard } from "lucide-react";
import { formatRupiah } from "@/lib/utils";

interface CartSummaryProps {
  total: number;
  itemCount: number;
  tableNumber: number | null;
  onCheckout: () => void;
  variant: "desktop" | "mobile"; // Prop untuk mengatur style
}

function CartSummary({ total, itemCount, tableNumber, onCheckout, variant }: CartSummaryProps) {
  const containerClass = variant === "desktop"
    ? "rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-6 shadow-xl shadow-primary/5"
    : "rounded-2xl border border-border/50 bg-background/80 backdrop-blur-xl p-4 shadow-2xl shadow-primary/10";

  return (
    <div className={containerClass}>
      {variant === "desktop" && (
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Receipt className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg">Ringkasan</h3>
        </div>
      )}

      {variant === "mobile" && (
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Total Pembayaran</span>
          <div className="flex flex-col items-end">
            <span className="text-xl font-black text-foreground">{formatRupiah(total)}</span>
            <span className="text-[10px] text-muted-foreground">{itemCount} Menu Item</span>
          </div>
        </div>
      )}

      {variant === "desktop" && (
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Total Item</span>
            <span>{itemCount} Item</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Meja</span>
            <span>{tableNumber ?? "-"}</span>
          </div>
          <div className="h-px bg-border/50 my-2" />
          <div className="flex justify-between items-end">
            <span className="font-semibold text-foreground">Total Harga</span>
            <span className="font-black text-2xl text-primary">{formatRupiah(total)}</span>
          </div>
        </div>
      )}

      <Button
        onClick={onCheckout}
        className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-primary to-primary/90 py-6 text-base font-bold shadow-lg hover:shadow-primary/25 transition-all active:scale-[0.98]"
      >
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
        <div className="relative flex items-center justify-center gap-2">
          <span>Lanjut Pembayaran</span>
          <CreditCard className="h-4 w-4" />
        </div>
      </Button>
    </div>
  );
}

export default memo(CartSummary);