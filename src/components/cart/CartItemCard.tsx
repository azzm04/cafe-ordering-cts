"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Minus, Plus, NotebookPen } from "lucide-react";
import { formatRupiah } from "@/lib/utils"; // Import helper tadi
import type { CartItemType } from "@/hooks/useCartLogic"; // Import tipe data

interface CartItemProps {
  item: CartItemType;
  isLoading: boolean;
  onRemove: (id: string) => void;
  onIncrement: (item: CartItemType) => void;
  onDecrement: (id: string, qty: number) => void;
  onUpdateNotes: (id: string, notes: string) => void;
}

function CartItemCard({
  item,
  isLoading,
  onRemove,
  onIncrement,
  onDecrement,
  onUpdateNotes
}: CartItemProps) {
  const isMaxReached = typeof item.max_portions === "number" && item.max_portions !== null && item.quantity >= item.max_portions;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm p-4 transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
      {/* Top Info */}
      <div className="flex justify-between gap-4">
        <div className="space-y-1 flex-1">
          <h4 className="font-bold text-base leading-tight">{item.name}</h4>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-primary">{formatRupiah(item.price)}</span>
            <span>x</span>
            <span>{item.quantity}</span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(item.id)}
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="my-3 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Controls */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <NotebookPen className="h-3.5 w-3.5" />
            <span className="opacity-70">Catatan</span>
          </div>

          <div className="flex items-center rounded-full bg-muted/50 p-1 border border-border/50 shadow-inner">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full hover:bg-background shadow-sm disabled:opacity-30"
              onClick={() => onDecrement(item.id, item.quantity - 1)}
              disabled={item.quantity <= 1 || isLoading}
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>

            <div className="w-8 text-center font-bold text-sm tabular-nums">
              {isLoading ? <span className="animate-spin inline-block">⟳</span> : item.quantity}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 rounded-full hover:bg-background shadow-sm transition-colors ${isMaxReached ? 'opacity-50 cursor-not-allowed' : 'hover:text-primary'}`}
              onClick={() => onIncrement(item)}
              disabled={isMaxReached || isLoading}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {isMaxReached && item.max_portions !== null && (
          <p className="text-[10px] text-amber-500 font-medium text-right -mt-2">
            Maksimal {item.max_portions} porsi
          </p>
        )}

        <div className="relative">
          <textarea
            className="w-full rounded-xl border border-border/50 bg-background/50 p-3 text-sm placeholder:text-muted-foreground/50 focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
            placeholder="Contoh: Jangan pedas, es dipisah..."
            value={item.notes ?? ""}
            onChange={(e) => onUpdateNotes(item.id, e.target.value)}
            rows={2}
          />
        </div>
      </div>
    </div>
  );
}

export default memo(CartItemCard);