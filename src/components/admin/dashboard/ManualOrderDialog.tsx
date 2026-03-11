"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  ShoppingCart,
  Trash2,
  CreditCard,
  Banknote,
  MapPin,
  Minus,
  Plus,
  Receipt,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";
import { MenuSelector, MenuItem, CartItem } from "./MenuSelector";

interface Table {
  id: string;
  table_number: number;
  status: "available" | "occupied" | "reserved";
}

interface ManualOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tables: Table[];
  onOrderCreated: () => void;
}

export function ManualOrderDialog({
  open,
  onOpenChange,
  tables,
  onOrderCreated,
}: ManualOrderDialogProps) {
  const [step, setStep] = useState<"table" | "menu" | "confirm">("table");
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "Online">("cash");
  const [customerName, setCustomerName] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMenu, setLoadingMenu] = useState(false);

  // Fetch menu items
  const fetchMenu = useCallback(async () => {
    setLoadingMenu(true);
    try {
      const res = await fetch("/api/menu?available=true");
      const json = await res.json();
      if (res.ok && Array.isArray(json.data)) {
        setMenuItems(json.data);
      }
    } catch (e) {
      console.error("Failed to fetch menu:", e);
      toast.error("Gagal memuat menu");
    } finally {
      setLoadingMenu(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchMenu();
    }
  }, [open, fetchMenu]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setStep("table");
      setSelectedTable(null);
      setCart([]);
      setPaymentMethod("cash");
      setCustomerName("");
      setOrderNotes("");
    }
  }, [open]);

  // Cart functions
  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prev) =>
      prev.map((c) => (c.id === itemId ? { ...c, quantity } : c))
    );
  };

  const updateNotes = (itemId: string, notes: string) => {
    setCart((prev) =>
      prev.map((c) => (c.id === itemId ? { ...c, notes } : c))
    );
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal;

  // Submit order
  const handleSubmit = async () => {
    if (!selectedTable) {
      toast.error("Pilih meja terlebih dahulu");
      return;
    }
    if (cart.length === 0) {
      toast.error("Keranjang masih kosong");
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        table_id: selectedTable.id,
        table_number: selectedTable.table_number,
        customer_name: customerName || `Meja ${selectedTable.table_number}`,
        payment_method: paymentMethod,
        notes: orderNotes,
        items: cart.map((item) => ({
          menu_id: item.id,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes || "",
        })),
        is_manual_order: true, // Flag untuk manual order
      };

      const res = await fetch("/api/admin/orders/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Gagal membuat order");
      }

      toast.success(`Order ${json.order_number} berhasil dibuat!`);
      onOrderCreated();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal membuat order");
    } finally {
      setLoading(false);
    }
  };

  // Available tables only
  const availableTables = tables.filter((t) => t.status === "available");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Receipt className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Manual Order</DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Buat pesanan langsung dari kasir
                </p>
              </div>
            </div>
            {/* Step Indicator */}
            <div className="flex items-center gap-2">
              <Badge
                variant={step === "table" ? "default" : "secondary"}
                className={step === "table" ? "bg-amber-700" : ""}
              >
                1. Pilih Meja
              </Badge>
              <span className="text-muted-foreground">→</span>
              <Badge
                variant={step === "menu" ? "default" : "secondary"}
                className={step === "menu" ? "bg-amber-700" : ""}
              >
                2. Pilih Menu
              </Badge>
              <span className="text-muted-foreground">→</span>
              <Badge
                variant={step === "confirm" ? "default" : "secondary"}
                className={step === "confirm" ? "bg-amber-700" : ""}
              >
                3. Konfirmasi
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {/* Step 1: Select Table */}
          {step === "table" && (
            <div className="p-6 h-full">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-600" />
                Pilih Meja Kosong
              </h3>
              
              {availableTables.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-xl">
                  <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">Tidak ada meja kosong saat ini</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {availableTables.map((table) => (
                    <button
                      key={table.id}
                      onClick={() => setSelectedTable(table)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                        selectedTable?.id === table.id
                          ? "bg-amber-100 border-amber-500 shadow-md"
                          : "bg-card border-border hover:border-amber-300 hover:shadow-sm"
                      }`}
                    >
                      <span className="text-xs text-muted-foreground">Meja</span>
                      <p className="text-3xl font-bold text-foreground">{table.table_number}</p>
                      <Badge variant="secondary" className="mt-2 bg-emerald-100 text-emerald-700">
                        Kosong
                      </Badge>
                    </button>
                  ))}
                </div>
              )}

              {selectedTable && (
                <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Meja dipilih:</p>
                      <p className="text-xl font-bold text-amber-700">
                        Meja {selectedTable.table_number}
                      </p>
                    </div>
                    <Button
                      onClick={() => setStep("menu")}
                      className="bg-amber-700 hover:bg-amber-800"
                    >
                      Lanjut Pilih Menu
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Menu */}
          {step === "menu" && (
            <div className="flex h-full">
              {/* Menu List */}
              <div className="flex-1 p-4 border-r overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-amber-600" />
                    Pilih Menu
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep("table")}
                  >
                    ← Ubah Meja
                  </Button>
                </div>

                {loadingMenu ? (
                  <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                  </div>
                ) : (
                  <MenuSelector
                    items={menuItems}
                    cart={cart}
                    onAddItem={addToCart}
                    onRemoveItem={removeFromCart}
                    onUpdateQuantity={updateQuantity}
                    onUpdateNotes={updateNotes}
                  />
                )}
              </div>

              {/* Cart Summary */}
              <div className="w-80 flex flex-col bg-muted/30">
                <div className="p-4 border-b">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-amber-600" />
                    Keranjang
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Meja {selectedTable?.table_number}
                  </p>
                </div>

                <ScrollArea className="flex-1 p-4">
                  {cart.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingCart className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">Keranjang kosong</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <Card key={item.id} className="p-3">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{item.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Rp {item.price.toLocaleString("id-ID")} × {item.quantity}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 w-7 p-0"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-8 text-center font-semibold text-sm">
                                {item.quantity}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 w-7 p-0"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                            <p className="font-bold text-sm text-amber-700">
                              Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                            </p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                {/* Cart Footer */}
                <div className="p-4 border-t bg-background">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold">Total</span>
                    <span className="text-xl font-bold text-amber-700">
                      Rp {total.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <Button
                    className="w-full bg-amber-700 hover:bg-amber-800"
                    disabled={cart.length === 0}
                    onClick={() => setStep("confirm")}
                  >
                    Lanjut Konfirmasi
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === "confirm" && (
            <div className="p-6 h-full overflow-auto">
              <div className="max-w-2xl mx-auto space-y-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep("menu")}
                  className="mb-2"
                >
                  ← Kembali ke Menu
                </Button>

                {/* Order Summary */}
                <Card className="p-5">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-amber-600" />
                    Ringkasan Pesanan
                  </h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Meja</span>
                      <span className="font-semibold">Meja {selectedTable?.table_number}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Jumlah Item</span>
                      <span className="font-semibold">
                        {cart.reduce((sum, item) => sum + item.quantity, 0)} item
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    {cart.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>
                          {item.name} × {item.quantity}
                        </span>
                        <span className="font-medium">
                          Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t mt-4 pt-4">
                    <div className="flex justify-between">
                      <span className="font-semibold">Total Bayar</span>
                      <span className="text-2xl font-bold text-amber-700">
                        Rp {total.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Customer Name */}
                <Card className="p-5">
                  <Label htmlFor="customerName" className="mb-2 block">
                    Nama Pelanggan (Opsional)
                  </Label>
                  <Input
                    id="customerName"
                    placeholder={`Meja ${selectedTable?.table_number}`}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="bg-background/50"
                  />
                </Card>

                {/* Payment Method */}
                <Card className="p-5">
                  <Label className="mb-3 block">Metode Pembayaran</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPaymentMethod("cash")}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        paymentMethod === "cash"
                          ? "bg-amber-50 border-amber-500"
                          : "border-border hover:border-amber-300"
                      }`}
                    >
                      <Banknote className={`w-8 h-8 mx-auto mb-2 ${
                        paymentMethod === "cash" ? "text-amber-700" : "text-muted-foreground"
                      }`} />
                      <p className="font-semibold">Tunai</p>
                      <p className="text-xs text-muted-foreground">Bayar di kasir</p>
                    </button>
                    <button
                      onClick={() => setPaymentMethod("Online")}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        paymentMethod === "Online"
                          ? "bg-blue-50 border-blue-500"
                          : "border-border hover:border-blue-300"
                      }`}
                    >
                      <CreditCard className={`w-8 h-8 mx-auto mb-2 ${
                        paymentMethod === "Online" ? "text-blue-700" : "text-muted-foreground"
                      }`} />
                      <p className="font-semibold">QRIS / E-Wallet</p>
                      <p className="text-xs text-muted-foreground">Via Online</p>
                    </button>
                  </div>
                </Card>

                {/* Notes */}
                <Card className="p-5">
                  <Label htmlFor="orderNotes" className="mb-2 block">
                    Catatan Order (Opsional)
                  </Label>
                  <Textarea
                    id="orderNotes"
                    placeholder="Catatan tambahan untuk order..."
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="bg-background/50 resize-none"
                    rows={3}
                  />
                </Card>

                {/* Submit Button */}
                <Button
                  className="w-full h-14 text-lg bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 shadow-lg"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Buat Order - Rp {total.toLocaleString("id-ID")}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}