"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCartStore } from "@/store/cartStore";
import { formatRupiah } from "@/lib/utils";
import type { CartItem as CartItemType } from "@/store/cartStore";

export function CartItem({ item }: { item: CartItemType }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateNotes = useCartStore((s) => s.updateNotes);

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">{item.name}</div>
          <div className="text-sm opacity-80">
            {formatRupiah(item.price)} × {item.quantity} ={" "}
            <span className="font-semibold">{formatRupiah(item.price * item.quantity)}</span>
          </div>
        </div>
        <Button variant="destructive" onClick={() => removeItem(item.id)}>
          Hapus
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
          -
        </Button>
        <div className="min-w-10 text-center text-sm font-semibold">{item.quantity}</div>
        <Button variant="secondary" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
          +
        </Button>
      </div>

      <div className="space-y-1">
        <div className="text-xs opacity-70">Catatan (opsional)</div>
        <Textarea
          value={item.notes ?? ""}
          onChange={(e) => updateNotes(item.id, e.target.value)}
          placeholder="Contoh: pedas ya / tanpa es"
          className="min-h-17.5"
        />
      </div>
    </Card>
  );
}
