// src/app/admin/manual-order/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Receipt } from "lucide-react";
import { toast } from "sonner";

// Import sub-components (Ensure these files exist as per previous messages)
import { StepIndicator } from "@/components/admin/manual-order/StepIndicator";
import { StepTableSelection } from "@/components/admin/manual-order/StepTableSelection";
import { StepMenuSelection } from "@/components/admin/manual-order/StepMenuSelection";
import { StepOrderConfirmation } from "@/components/admin/manual-order/StepOrderConfirmation";

// Import types
import type { Table, CartItem, MenuItem } from "@/types/manual-order";

export default function ManualOrderPage() {
  const [step, setStep] = useState<"table" | "menu" | "confirm">("table");
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  // --- Cart Logic ---
  const addToCart = (item: MenuItem) => {
    const isOutOfStock = item.max_portions === 0;
    if (isOutOfStock) {
      toast.error("Menu ini sedang habis");
      return;
    }

    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        if (typeof item.max_portions === 'number' && existing.quantity >= item.max_portions) {
          toast.error(`Maksimal ${item.max_portions} porsi`);
          return prev;
        }
        return prev.map((c) => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`${item.name} ditambahkan`);
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    const item = cart.find((c) => c.id === itemId);
    if (item && typeof item.max_portions === 'number' && quantity > item.max_portions) {
      toast.error(`Maksimal ${item.max_portions} porsi`);
      return;
    }
    setCart((prev) => prev.map((c) => (c.id === itemId ? { ...c, quantity } : c)));
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-stone-100 via-amber-50/30 to-stone-100">
      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-amber-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/admin/kasir">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
                  </Button>
                </Link>
                <div className="h-6 w-px bg-border"></div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-amber-700 to-amber-900 text-white shadow-lg">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-amber-800 to-amber-900 bg-clip-text text-transparent">
                      Manual Order
                    </h1>
                    <p className="text-xs text-muted-foreground">Kasir Mode</p>
                  </div>
                </div>
              </div>

              <StepIndicator step={step} setStep={setStep} hasTable={!!selectedTable} hasCart={cart.length > 0} />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-auto">
          {step === "table" && (
            <StepTableSelection 
              selectedTable={selectedTable} 
              onSelectTable={(table) => {
                setSelectedTable(table);
                // Optional: Auto advance if you prefer
                // setStep("menu"); 
              }} 
              onNext={() => setStep("menu")} 
            />
          )}

          {step === "menu" && selectedTable && (
            <StepMenuSelection 
              selectedTable={selectedTable}
              cart={cart}
              addToCart={addToCart}
              removeFromCart={removeFromCart}
              updateQuantity={updateQuantity}
              onNext={() => setStep("confirm")}
              onBack={() => setStep("table")}
            />
          )}

          {step === "confirm" && selectedTable && (
            <StepOrderConfirmation 
              selectedTable={selectedTable}
              cart={cart}
              onBack={() => setStep("menu")}
            />
          )}
        </div>
      </div>
    </main>
  );
}