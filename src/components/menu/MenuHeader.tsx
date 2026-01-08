"use client";

import { Button } from "@/components/ui/button";

export default function MenuHeader({
  tableNumber,
  itemCount,
  onGoCart,
}: {
  tableNumber: number;
  itemCount: number;
  onGoCart: () => void;
}) {
  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
      <div className="space-y-1">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Menu</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Meja {tableNumber}</p>
      </div>

      <Button
        onClick={onGoCart}
        className="w-full sm:w-auto shrink-0 bg-primary hover:bg-primary/90 font-semibold"
      >
        🛒 Keranjang ({itemCount})
      </Button>
    </header>
  );
}
