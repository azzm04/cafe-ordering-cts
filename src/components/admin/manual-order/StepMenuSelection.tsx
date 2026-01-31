"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  ShoppingCart,
  Search,
  ArrowLeft,
  Package,
  ChevronDown,
  Utensils,
  Loader2,
  Minus,
  Plus,
  Receipt,
  X,
  ArrowRight,
  MessageSquare,
  Edit3,
} from "lucide-react";
import { toast } from "sonner";
import { formatRupiah } from "@/lib/utils";
import type { CartItem, MenuItem, Table } from "@/types/manual-order";

const CATEGORY = {
  makanan: "f3274eb8-d206-4591-a1f5-855981748ee0",
  minuman: "e045633e-b497-4169-9cc3-69aca2a42f31",
} as const;

type TabKey = keyof typeof CATEGORY;

interface Props {
  selectedTable: Table;
  cart: CartItem[];
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, qty: number) => void;
  updateNotes: (itemId: string, notes: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepMenuSelection({
  selectedTable,
  cart,
  addToCart,
  removeFromCart,
  updateQuantity,
  updateNotes,
  onNext,
  onBack,
}: Props) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("makanan");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [cartSheetOpen, setCartSheetOpen] = useState(false);

  // Notes dialog state
  const [notesDialog, setNotesDialog] = useState<{
    isOpen: boolean;
    itemId: string;
    itemName: string;
    currentNotes: string;
  }>({
    isOpen: false,
    itemId: "",
    itemName: "",
    currentNotes: "",
  });

  const fetchMenu = useCallback(async () => {
    setLoadingMenu(true);
    try {
      const url = new URL("/api/menu-items", window.location.origin);
      url.searchParams.set("category_id", CATEGORY[activeTab]);
      if (search.trim()) url.searchParams.set("q", search.trim());

      const res = await fetch(url.toString(), { cache: "no-store" });
      const json = await res.json();

      if (res.ok && Array.isArray(json.items)) {
        setMenuItems(json.items);
        if (json.items.length > 0) {
          const firstGroup =
            (json.items[0].variant_group ?? "Lainnya").trim() || "Lainnya";
          setExpandedGroups(new Set([firstGroup]));
        }
      }
    } catch (e) {
      toast.error("Gagal memuat menu");
    } finally {
      setLoadingMenu(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchMenu();
    }, 350);
    return () => clearTimeout(t);
  }, [search, fetchMenu]);

  const groupedItems = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const item of menuItems) {
      const key = (item.variant_group ?? "Lainnya").trim() || "Lainnya";
      const arr = map.get(key) ?? [];
      arr.push(item);
      map.set(key, arr);
    }
    return Array.from(map.entries()).map(([groupName, groupItems]) => ({
      groupName,
      groupItems,
    }));
  }, [menuItems]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupName)) next.delete(groupName);
      else next.add(groupName);
      return next;
    });
  };

  const openNotesDialog = (itemId: string, itemName: string) => {
    const cartItem = cart.find((c) => c.id === itemId);
    setNotesDialog({
      isOpen: true,
      itemId,
      itemName,
      currentNotes: cartItem?.notes || "",
    });
  };

  const saveNotes = () => {
    updateNotes(notesDialog.itemId, notesDialog.currentNotes.trim());
    toast.success("Catatan disimpan");
    setNotesDialog({
      isOpen: false,
      itemId: "",
      itemName: "",
      currentNotes: "",
    });
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const getCartQuantity = (itemId: string) =>
    cart.find((c) => c.id === itemId)?.quantity || 0;

  // Cart Content Component (reusable for both desktop sidebar and mobile sheet)
  const CartContent = () => (
    <>
      <div className="flex-1 overflow-auto p-4 min-h-0 custom-scrollbar">
        {cart.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Keranjang kosong</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-muted/30 border border-border/50 relative group"
              >
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRupiah(item.price)} × {item.quantity}
                    </p>

                    {/* Show notes if exists */}
                    {item.notes && (
                      <div className="mt-1 flex items-start gap-1 text-xs text-amber-700 bg-amber-50 p-1.5 rounded border border-amber-200">
                        <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{item.notes}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 w-6 p-0"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-6 text-center text-xs font-bold">
                      {item.quantity}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 w-6 p-0"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={
                        typeof item.max_portions === "number" &&
                        item.quantity >= item.max_portions
                      }
                    >
                      <Plus className="w-3 h-3" />
                    </Button>

                    {/* Edit notes button in cart */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 w-6 p-0 ml-1"
                      onClick={() => openNotesDialog(item.id, item.name)}
                      title="Edit catatan"
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="font-bold text-sm text-amber-700">
                    {formatRupiah(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t bg-white">
        <div className="flex justify-between items-center mb-4">
          <span className="font-semibold">Total</span>
          <span className="text-2xl font-bold text-amber-700">
            {formatRupiah(total)}
          </span>
        </div>
        <Button
          className="w-full bg-amber-700 hover:bg-amber-800 text-white shadow-md"
          size="lg"
          disabled={cart.length === 0}
          onClick={() => {
            setCartSheetOpen(false);
            onNext();
          }}
        >
          Lanjut Konfirmasi <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile/Tablet: Single column with floating cart button */}
      <div className="lg:hidden flex flex-col h-[calc(100vh-140px)] sm:h-[calc(100vh-160px)]">
        <Card className="flex-1 flex flex-col border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
          <div className="p-3 sm:p-4 border-b bg-gradient-to-r from-amber-50 to-orange-50">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                <span className="hidden sm:inline">Pilih Menu</span>
                <span className="sm:hidden">Menu</span>
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="h-8"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span className="hidden sm:inline">Ubah Meja</span>
                <span className="sm:hidden text-xs">Meja</span>
              </Button>
            </div>

            <div className="flex gap-2 mb-3">
              {(["makanan", "minuman"] as TabKey[]).map((tab) => (
                <Button
                  key={tab}
                  variant={activeTab === tab ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 h-9 text-xs sm:text-sm ${
                    activeTab === tab
                      ? "bg-amber-700 hover:bg-amber-800"
                      : "bg-white/80"
                  }`}
                >
                  {tab === "makanan" ? "🍽️ Makanan" : "🥤 Minuman"}
                </Button>
              ))}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
              <Input
                placeholder="Cari menu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 sm:pl-10 bg-white/80 h-9 text-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto p-3 sm:p-4 min-h-0 custom-scrollbar pb-20">
            {loadingMenu ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
              </div>
            ) : groupedItems.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground text-sm">
                  Tidak ada menu ditemukan
                </p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {groupedItems.map(({ groupName, groupItems }) => (
                  <div
                    key={groupName}
                    className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => toggleGroup(groupName)}
                      className="flex w-full items-center justify-between bg-muted/30 px-3 sm:px-4 py-2.5 sm:py-3 text-left transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                        </div>
                        <div>
                          <h3 className="text-xs sm:text-sm font-bold leading-none text-foreground">
                            {groupName}
                          </h3>
                          <p className="mt-1 text-[9px] sm:text-[10px] font-medium text-muted-foreground">
                            {groupItems.length} item
                          </p>
                        </div>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground transition-transform duration-200 ${
                          expandedGroups.has(groupName) ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {expandedGroups.has(groupName) && (
                      <div className="divide-y divide-border/50 border-t border-border/50 bg-background/50">
                        {groupItems.map((item) => {
                          const qty = getCartQuantity(item.id);
                          const isOutOfStock = item.max_portions === 0;
                          const reachedMax =
                            typeof item.max_portions === "number" &&
                            qty >= item.max_portions;

                          return (
                            <div
                              key={item.id}
                              className="p-2.5 sm:p-3 hover:bg-muted/10 transition-colors"
                            >
                              <div className="flex gap-3 sm:gap-4">
                                <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                                  {item.image_url ? (
                                    <Image
                                      src={item.image_url}
                                      alt={item.name}
                                      fill
                                      className={`object-cover ${
                                        isOutOfStock
                                          ? "grayscale opacity-70"
                                          : ""
                                      }`}
                                      sizes="(max-width: 640px) 64px, 80px"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-secondary/30 text-muted-foreground">
                                      <Utensils className="h-5 w-5 sm:h-6 sm:w-6 opacity-40" />
                                    </div>
                                  )}
                                  {isOutOfStock && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                                      <span className="rounded-full bg-destructive/90 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase text-white">
                                        Habis
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-1 min-w-0 flex-col justify-between">
                                  <div>
                                    <h4 className="line-clamp-2 text-xs sm:text-sm font-semibold leading-tight text-foreground">
                                      {item.name}
                                    </h4>
                                    {!isOutOfStock &&
                                      item.max_portions !== null && (
                                        <span
                                          className={`mt-1 inline-block text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded border ${
                                            item.max_portions! < 5
                                              ? "bg-amber-50 text-amber-700 border-amber-200"
                                              : "bg-green-50 text-green-700 border-green-200"
                                          }`}
                                        >
                                          Stok: {item.max_portions}
                                        </span>
                                      )}
                                  </div>

                                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-2">
                                    <span className="text-xs sm:text-sm font-bold text-primary">
                                      {formatRupiah(item.price)}
                                    </span>

                                    {qty > 0 ? (
                                      <div className="flex items-center gap-1.5 sm:gap-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                                          onClick={() =>
                                            updateQuantity(item.id, qty - 1)
                                          }
                                        >
                                          <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                        </Button>
                                        <span className="w-5 sm:w-6 text-center font-bold text-xs sm:text-sm">
                                          {qty}
                                        </span>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-6 w-6 sm:h-7 sm:w-7 p-0 bg-amber-700 hover:bg-amber-800 text-white border-0"
                                          onClick={() =>
                                            updateQuantity(item.id, qty + 1)
                                          }
                                          disabled={reachedMax}
                                        >
                                          <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                        </Button>

                                        {/* Notes button */}
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                                          onClick={() =>
                                            openNotesDialog(item.id, item.name)
                                          }
                                          title="Tambah catatan"
                                        >
                                          <MessageSquare className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <Button
                                        size="sm"
                                        className="h-6 sm:h-7 px-2 sm:px-3 bg-amber-700 hover:bg-amber-800 text-white text-[10px] sm:text-xs"
                                        onClick={() => addToCart(item)}
                                        disabled={isOutOfStock}
                                      >
                                        <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                                        Tambah
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Floating Cart Button (Mobile/Tablet) */}
        <Sheet open={cartSheetOpen} onOpenChange={setCartSheetOpen}>
          <SheetTrigger asChild>
            <Button
              className="fixed bottom-4 right-4 h-14 w-14 sm:h-16 sm:w-16 rounded-full shadow-2xl bg-amber-700 hover:bg-amber-800 text-white z-50"
              size="icon"
            >
              <div className="relative">
                <ShoppingCart className="h-6 w-6 sm:h-7 sm:w-7" />
                {totalItems > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center p-0 bg-red-500 text-white text-[10px] sm:text-xs">
                    {totalItems}
                  </Badge>
                )}
              </div>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-full sm:w-96 p-0 flex flex-col"
          >
            <SheetHeader className="p-4 border-b bg-gradient-to-r from-amber-50 to-orange-50">
              <SheetTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-600" />
                Keranjang
                {totalItems > 0 && (
                  <Badge className="bg-amber-700 text-white ml-auto">
                    {totalItems}
                  </Badge>
                )}
              </SheetTitle>
              <p className="text-xs text-muted-foreground text-left">
                Meja {selectedTable.table_number}
              </p>
            </SheetHeader>
            <CartContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Two column layout (original) */}
      <div className="hidden lg:flex gap-6 h-[calc(100vh-180px)]">
        {/* LEFT: MENU LIST */}
        <div className="flex-1 flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden min-h-0">
            <div className="p-4 border-b bg-gradient-to-r from-amber-50 to-orange-50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-amber-600" /> Pilih Menu
                </h2>
                <Button variant="ghost" size="sm" onClick={onBack}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Ubah Meja
                </Button>
              </div>

              <div className="flex gap-2 mb-4">
                {(["makanan", "minuman"] as TabKey[]).map((tab) => (
                  <Button
                    key={tab}
                    variant={activeTab === tab ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveTab(tab)}
                    className={
                      activeTab === tab
                        ? "bg-amber-700 hover:bg-amber-800"
                        : "bg-white/80"
                    }
                  >
                    {tab === "makanan" ? "🍽️ Makanan" : "🥤 Minuman"}
                  </Button>
                ))}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cari menu..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-white/80"
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 min-h-0 custom-scrollbar">
              {loadingMenu ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                </div>
              ) : groupedItems.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">
                    Tidak ada menu ditemukan
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {groupedItems.map(({ groupName, groupItems }) => (
                    <div
                      key={groupName}
                      className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
                    >
                      <button
                        type="button"
                        onClick={() => toggleGroup(groupName)}
                        className="flex w-full items-center justify-between bg-muted/30 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Package className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold leading-none text-foreground">
                              {groupName}
                            </h3>
                            <p className="mt-1 text-[10px] font-medium text-muted-foreground">
                              {groupItems.length} item
                            </p>
                          </div>
                        </div>
                        <ChevronDown
                          className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                            expandedGroups.has(groupName) ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {expandedGroups.has(groupName) && (
                        <div className="divide-y divide-border/50 border-t border-border/50 bg-background/50">
                          {groupItems.map((item) => {
                            const qty = getCartQuantity(item.id);
                            const isOutOfStock = item.max_portions === 0;
                            const reachedMax =
                              typeof item.max_portions === "number" &&
                              qty >= item.max_portions;

                            return (
                              <div
                                key={item.id}
                                className="p-3 sm:p-4 hover:bg-muted/10 transition-colors"
                              >
                                <div className="flex gap-4">
                                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                                    {item.image_url ? (
                                      <Image
                                        src={item.image_url}
                                        alt={item.name}
                                        fill
                                        className={`object-cover ${
                                          isOutOfStock
                                            ? "grayscale opacity-70"
                                            : ""
                                        }`}
                                        sizes="80px"
                                      />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center bg-secondary/30 text-muted-foreground">
                                        <Utensils className="h-6 w-6 opacity-40" />
                                      </div>
                                    )}
                                    {isOutOfStock && (
                                      <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                                        <span className="rounded-full bg-destructive/90 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                                          Habis
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex flex-1 min-w-0 flex-col justify-between">
                                    <div>
                                      <h4 className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">
                                        {item.name}
                                      </h4>
                                      {!isOutOfStock &&
                                        item.max_portions !== null && (
                                          <span
                                            className={`mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded border ${
                                              item.max_portions! < 5
                                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                                : "bg-green-50 text-green-700 border-green-200"
                                            }`}
                                          >
                                            Stok: {item.max_portions}
                                          </span>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between mt-2">
                                      <span className="text-sm font-bold text-primary">
                                        {formatRupiah(item.price)}
                                      </span>

                                      {qty > 0 ? (
                                        <div className="flex items-center gap-2">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 w-7 p-0"
                                            onClick={() =>
                                              updateQuantity(item.id, qty - 1)
                                            }
                                          >
                                            <Minus className="w-3 h-3" />
                                          </Button>
                                          <span className="w-6 text-center font-bold text-sm">
                                            {qty}
                                          </span>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 w-7 p-0 bg-amber-700 hover:bg-amber-800 text-white border-0"
                                            onClick={() =>
                                              updateQuantity(item.id, qty + 1)
                                            }
                                            disabled={reachedMax}
                                          >
                                            <Plus className="w-3 h-3" />
                                          </Button>

                                          {/* Notes button */}
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 w-7 p-0"
                                            onClick={() =>
                                              openNotesDialog(
                                                item.id,
                                                item.name,
                                              )
                                            }
                                            title="Tambah catatan"
                                          >
                                            <MessageSquare className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <Button
                                          size="sm"
                                          className="h-7 px-3 bg-amber-700 hover:bg-amber-800 text-white text-xs"
                                          onClick={() => addToCart(item)}
                                          disabled={isOutOfStock}
                                        >
                                          <Plus className="w-3 h-3 mr-1" />{" "}
                                          Tambah
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT: CART SIDEBAR (Desktop only) */}
        <div className="w-80 flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden min-h-0">
            <div className="p-4 border-b bg-gradient-to-r from-amber-50 to-orange-50">
              <h3 className="font-bold flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-600" />
                Keranjang
                {totalItems > 0 && (
                  <Badge className="bg-amber-700 text-white ml-auto">
                    {totalItems}
                  </Badge>
                )}
              </h3>
              <p className="text-xs text-muted-foreground">
                Meja {selectedTable.table_number}
              </p>
            </div>
            <CartContent />
          </Card>
        </div>
      </div>

      {/* Notes Dialog */}
      <Dialog
        open={notesDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setNotesDialog({
              isOpen: false,
              itemId: "",
              itemName: "",
              currentNotes: "",
            });
          }
        }}
      >
        <DialogContent className="sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              Catatan untuk Pesanan
            </DialogTitle>
            <DialogDescription className="text-sm">
              {notesDialog.itemName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Contoh: Pedas sedang, Tanpa es, Extra sambal, dll."
              value={notesDialog.currentNotes}
              onChange={(e) =>
                setNotesDialog((prev) => ({
                  ...prev,
                  currentNotes: e.target.value,
                }))
              }
              rows={4}
              className="resize-none text-sm"
            />
            <p className="text-xs text-muted-foreground">
              💡 Catatan ini akan dicetak di struk dapur/bar
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setNotesDialog({
                  isOpen: false,
                  itemId: "",
                  itemName: "",
                  currentNotes: "",
                })
              }
              className="w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={saveNotes}
              className="w-full sm:w-auto"
            >
              Simpan Catatan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
