import { useCartStore } from "@/store/cartStore";

export function useCart() {
  const items = useCartStore((s) => s.items);
  const tableNumber = useCartStore((s) => s.tableNumber);
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const updateNotes = useCartStore((s) => s.updateNotes);
  const setTableNumber = useCartStore((s) => s.setTableNumber);
  const clearCart = useCartStore((s) => s.clearCart);
  const getTotalAmount = useCartStore((s) => s.getTotalAmount);
  const getItemCount = useCartStore((s) => s.getItemCount);

  return {
    items,
    tableNumber,
    addItem,
    removeItem,
    updateQuantity,
    updateNotes,
    setTableNumber,
    clearCart,
    getTotalAmount,
    getItemCount,
  };
}
