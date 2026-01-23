"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Minus, Coffee, UtensilsCrossed, Wine, Cake, Package } from "lucide-react";

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image_url?: string;
  is_available: boolean;
  stock?: number;
}

export interface CartItem extends MenuItem {
  quantity: number;
  notes?: string;
}

interface MenuSelectorProps {
  items: MenuItem[];
  cart: CartItem[];
  onAddItem: (item: MenuItem) => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onUpdateNotes: (itemId: string, notes: string) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  "coffee": <Coffee className="w-4 h-4" />,
  "kopi": <Coffee className="w-4 h-4" />,
  "food": <UtensilsCrossed className="w-4 h-4" />,
  "makanan": <UtensilsCrossed className="w-4 h-4" />,
  "drink": <Wine className="w-4 h-4" />,
  "minuman": <Wine className="w-4 h-4" />,
  "dessert": <Cake className="w-4 h-4" />,
  "snack": <Cake className="w-4 h-4" />,
};

export function MenuSelector({
  items,
  cart,
  onAddItem,
  onRemoveItem,
  onUpdateQuantity,
}: MenuSelectorProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(items.map((item) => item.category));
    return ["all", ...Array.from(cats)];
  }, [items]);

  // Filter items by search and category
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchCategory = selectedCategory === "all" || item.category === selectedCategory;
      return matchSearch && matchCategory && item.is_available;
    });
  }, [items, search, selectedCategory]);

  // Get cart quantity for an item
  const getCartQuantity = (itemId: string) => {
    const cartItem = cart.find((c) => c.id === itemId);
    return cartItem?.quantity || 0;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Cari menu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-background/50"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
            className={`whitespace-nowrap ${
              selectedCategory === cat
                ? "bg-amber-700 hover:bg-amber-800 text-white"
                : "bg-background/50"
            }`}
          >
            {categoryIcons[cat.toLowerCase()] || <Package className="w-4 h-4 mr-1" />}
            <span className="ml-1 capitalize">{cat === "all" ? "Semua" : cat}</span>
          </Button>
        ))}
      </div>

      {/* Menu Grid */}
      <ScrollArea className="flex-1 -mx-1 px-1">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredItems.map((item) => {
            const qty = getCartQuantity(item.id);
            const inCart = qty > 0;

            return (
              <div
                key={item.id}
                className={`relative p-3 rounded-xl border transition-all duration-200 ${
                  inCart
                    ? "bg-amber-50 border-amber-300 shadow-md"
                    : "bg-card border-border/60 hover:border-primary/40 hover:shadow-sm"
                }`}
              >
                {/* Stock Badge */}
                {item.stock !== undefined && item.stock <= 5 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 text-[10px] px-1.5"
                  >
                    Sisa {item.stock}
                  </Badge>
                )}

                {/* Item Info */}
                <div className="mb-3">
                  <p className="font-semibold text-sm text-foreground line-clamp-2 leading-tight">
                    {item.name}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize mt-0.5">
                    {item.category}
                  </p>
                  <p className="text-base font-bold text-amber-700 mt-1">
                    Rp {item.price.toLocaleString("id-ID")}
                  </p>
                </div>

                {/* Quantity Controls */}
                {inCart ? (
                  <div className="flex items-center justify-between gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        if (qty === 1) {
                          onRemoveItem(item.id);
                        } else {
                          onUpdateQuantity(item.id, qty - 1);
                        }
                      }}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="font-bold text-lg text-amber-700 min-w-[2rem] text-center">
                      {qty}
                    </span>
                    <Button
                      size="sm"
                      className="h-8 w-8 p-0 bg-amber-700 hover:bg-amber-800"
                      onClick={() => onUpdateQuantity(item.id, qty + 1)}
                      disabled={item.stock !== undefined && qty >= item.stock}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    className="w-full bg-amber-700 hover:bg-amber-800 text-white"
                    onClick={() => onAddItem(item)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Tambah
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Tidak ada menu ditemukan</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}