import { create } from "zustand";

export interface CartItem {
  id: string; // menu_item_id
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  image_url?: string;
  max_portions?: number | null;
}

interface CartStore {
  items: CartItem[];
  tableNumber: number | null;

  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateNotes: (id: string, notes: string) => void;
  setTableNumber: (number: number) => void;

  clearCart: () => void;
  getTotalAmount: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  tableNumber: null,

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((x) => x.id === item.id);
      if (existing) {
        const max = existing.max_portions ?? item.max_portions ?? Number.POSITIVE_INFINITY;
        const newQty = Math.min(existing.quantity + item.quantity, max);
        return {
          items: state.items.map((x) =>
            x.id === item.id ? { ...x, quantity: newQty } : x
          ),
        };
      }
      return { items: [...state.items, item] };
    }),

  removeItem: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),

  updateQuantity: (id, quantity) =>
    set((s) => ({
      items: s.items.map((x) =>
        x.id === id
          ? {
              ...x,
              quantity: Math.min(
                Math.max(1, quantity),
                x.max_portions ?? Number.POSITIVE_INFINITY
              ),
            }
          : x
      ),
    })),

  updateNotes: (id, notes) =>
    set((s) => ({
      items: s.items.map((x) => (x.id === id ? { ...x, notes } : x)),
    })),

  setTableNumber: (number) => set({ tableNumber: number }),

  clearCart: () => set({ items: [], tableNumber: null }),

  getTotalAmount: () => get().items.reduce((acc, x) => acc + x.price * x.quantity, 0),
  getItemCount: () => get().items.reduce((acc, x) => acc + x.quantity, 0),
}));
