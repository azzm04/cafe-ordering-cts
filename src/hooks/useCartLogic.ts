"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCartStore } from "@/store/cartStore";

// Definisikan Interface agar No-Any
export interface CartItemType {
  id: string;
  name: string;
  price: number;
  quantity: number;
  max_portions?: number | null;
  notes?: string;
  image_url?: string;
}

export function useCartLogic() {
  const router = useRouter();
  
  // Store Selectors
  const tableNumber = useCartStore((s) => s.tableNumber);
  const items = useCartStore((s) => s.items) as CartItemType[];
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const updateNotes = useCartStore((s) => s.updateNotes);
  const getTotalAmount = useCartStore((s) => s.getTotalAmount);

  const total = useMemo(() => getTotalAmount(), [getTotalAmount, items]);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  // Navigation Logic
  const handleBack = () => {
    if (window.history.length > 1) router.back();
    else router.push("/menu");
  };

  const handleCheckout = () => {
    router.push("/pembayaran");
  };

  // Complex Async Logic
  const handleIncrement = async (it: CartItemType) => {
    if (loadingIds.has(it.id)) return;
    setLoadingIds((prev) => new Set(prev).add(it.id));

    // Construct payload safely
    const currentCartItems = useCartStore.getState().items.map((x) => ({
      menu_item_id: x.id,
      quantity: x.quantity
    }));

    const idx = currentCartItems.findIndex((x) => x.menu_item_id === it.id);
    if (idx >= 0) currentCartItems[idx].quantity = currentCartItems[idx].quantity + 1;

    try {
      const res = await fetch('/api/cart/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: currentCartItems }),
      });
      const json = await res.json();

      if (!res.ok || !json?.ok) {
        if (json?.shortages && Array.isArray(json.shortages) && json.shortages.length > 0) {
          const s = json.shortages[0];
          const ingredientId = s.ingredient_id || "Unknown";
          const available = s.available ?? 0;
          toast.error("Stok tidak cukup", {
            description: `Bahan ${ingredientId} kurang (Sisa: ${available})`
          });
        } else {
          toast.error("Stok tidak cukup", {
            description: "Maksimal porsi tercapai atau stok habis."
          });
        }
        return;
      }
      updateQuantity(it.id, it.quantity + 1);
    } catch (err) {
      console.error('availability check failed', err);
      toast.error('Gagal cek stok', { description: "Terjadi kesalahan koneksi" });
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(it.id);
        return next;
      });
    }
  };

  return {
    tableNumber,
    items,
    total,
    loadingIds,
    handleBack,
    handleCheckout,
    handleIncrement,
    removeItem,
    updateQuantity,
    updateNotes,
  };
}