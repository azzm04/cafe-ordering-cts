"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ShoppingBag, Utensils } from "lucide-react";
import { useCartLogic } from "@/hooks/useCartLogic";
import CartItemCard from "@/components/cart/CartItemCard";
import CartSummary from "@/components/cart/CartSummary";
import BackgroundDecorations from "@/components/shared/BackgroundDecorations";


export default function KeranjangPage() {
  // manggil semua Logic Hook
  const {
    tableNumber,
    items,
    total,
    loadingIds,
    handleBack,
    handleCheckout,
    handleIncrement,
    removeItem,
    updateQuantity,
    updateNotes
  } = useCartLogic();

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden">
      <BackgroundDecorations />

      <div className="relative z-10 mx-auto min-h-screen flex flex-col max-w-md md:max-w-5xl md:px-6">
        {/* --- HEADER --- */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-background/80 backdrop-blur-md border-b border-border/40 md:rounded-b-2xl md:top-4 md:border md:shadow-sm transition-all">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold leading-none">Keranjang</h1>
              <span className="text-xs text-muted-foreground font-medium">
                Meja {tableNumber ?? "-"}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary">
            <ShoppingBag className="h-4 w-4" />
          </div>
        </header>

        {/* --- CONTENT LAYOUT --- */}
        <div className="flex-1 px-4 py-6 md:px-0">
          {items.length === 0 ? (
            // Empty State
            <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center animate-in fade-in zoom-in-95 duration-500 min-h-[50vh]">
              <div className="relative h-24 w-24">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                <div className="relative flex items-center justify-center h-full w-full bg-card/50 rounded-full border border-dashed border-border">
                  <Utensils className="h-10 w-10 text-muted-foreground/50" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold">Keranjang Kosong</h3>
                <p className="text-sm text-muted-foreground max-w-[250px] mx-auto">
                  Belum ada menu yang dipilih. Yuk pesan sesuatu yang enak!
                </p>
              </div>
              <Button onClick={handleBack} className="mt-4 rounded-full px-6">
                Lihat Menu
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-start">
              
              {/* Left Column: Cart Items */}
              <div className="space-y-4 pb-32 md:pb-0 md:col-span-8">
                {items.map((it) => (
                  <CartItemCard
                    key={it.id}
                    item={it}
                    isLoading={loadingIds.has(it.id)}
                    onRemove={removeItem}
                    onIncrement={handleIncrement}
                    onDecrement={updateQuantity}
                    onUpdateNotes={updateNotes}
                  />
                ))}
              </div>

              {/* Right Column: Desktop Summary (Sticky) */}
              <div className="hidden md:block md:col-span-4 md:sticky md:top-28">
                <CartSummary 
                  variant="desktop"
                  total={total}
                  itemCount={items.length}
                  tableNumber={tableNumber}
                  onCheckout={handleCheckout}
                />
              </div>
            </div>
          )}
        </div>

        {/* --- MOBILE STICKY FOOTER --- */}
        {items.length > 0 && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 mx-auto max-w-md p-4">
             <CartSummary 
                variant="mobile"
                total={total}
                itemCount={items.length}
                tableNumber={tableNumber}
                onCheckout={handleCheckout}
              />
          </div>
        )}
      </div>
    </main>
  );
}