"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Sparkles } from "lucide-react";

type MenuHeaderProps = {
  tableNumber: number;
  itemCount: number;
  onGoCart: () => void;
};

function MenuHeader({ tableNumber, itemCount, onGoCart }: MenuHeaderProps) {
  return (
    <header className="relative space-y-4 pb-2 sm:pb-4">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        {/* Left: Title Section */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Menu</h1>
            
            {/* Table Badge */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold text-primary shadow-sm">
              <Sparkles className="h-3 w-3" />
              <span>Meja {tableNumber}</span>
            </div>
          </div>
          
          <p className="text-sm font-medium text-muted-foreground">
            Silakan pilih menu favorit Anda
          </p>
        </div>

        {/* Right: Cart Button */}
        <Button
          onClick={onGoCart}
          className="group relative h-10 w-full overflow-hidden rounded-full px-6 font-semibold shadow-md transition-all hover:scale-105 hover:shadow-lg active:scale-95 sm:w-auto"
        >
          {/* Shine Effect */}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          
          <div className="relative flex items-center gap-2">
            <div className="relative">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white ring-2 ring-primary">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </div>
            <span>Keranjang</span>
          </div>
        </Button>
      </div>
    </header>
  );
}

export default memo(MenuHeader);