"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, Search, RefreshCw } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { supabaseBrowser } from "@/lib/supabase/browser";


type MenuItemRow = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  created_at: string;
  variant_group: string | null;
};

type MenuItemsResponse = {
  items: MenuItemRow[];
  message?: string;
};

const CATEGORY = {
  makanan: "f3274eb8-d206-4591-a1f5-855981748ee0",
  minuman: "e045633e-b497-4169-9cc3-69aca2a42f31",
} as const;

type TabKey = keyof typeof CATEGORY;

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function MenuPage() {
  const router = useRouter();

  const tableNumber = useCartStore((s) => s.tableNumber);
  const addItem = useCartStore((s) => s.addItem);
  const itemCount = useCartStore((s) => s.getItemCount());

  const [activeTab, setActiveTab] = useState<TabKey>("makanan");
  const [query, setQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [items, setItems] = useState<MenuItemRow[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (tableNumber == null) {
      router.replace("/pilih-meja");
    }
  }, [tableNumber, router]);

  const loadMenu = async () => {
    setLoading(true);
    try {
      const categoryId = CATEGORY[activeTab];
      const url = new URL("/api/menu-items", window.location.origin);
      url.searchParams.set("category_id", categoryId);
      if (query.trim().length > 0) url.searchParams.set("q", query.trim());

      const res = await fetch(url.toString(), {
        method: "GET",
        cache: "no-store",
        headers: { "cache-control": "no-cache" },
      });

      const json = (await res.json()) as MenuItemsResponse;

      if (!res.ok) {
        throw new Error(json.message ?? "Gagal ambil menu");
      }

      const loadedItems = Array.isArray(json.items) ? json.items : [];
      setItems(loadedItems);
      
      // Auto expand first group
      if (loadedItems.length > 0 && expandedGroups.size === 0) {
        const firstGroup = (loadedItems[0].variant_group ?? "Lainnya").trim() || "Lainnya";
        setExpandedGroups(new Set([firstGroup]));
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Terjadi error";
      toast.error(message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setExpandedGroups(new Set()); // Reset expanded groups saat ganti tab
    loadMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Auto reload setelah stop ngetik (debounce)
  useEffect(() => {
    const t = window.setTimeout(() => {
      loadMenu();
    }, 350);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    // sekali load awal
    loadMenu();

    // realtime subscribe
    const channel = supabaseBrowser
      .channel("realtime-menu-items")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "menu_items" },
        () => {
          // setiap ada insert/update/delete -> refresh list
          loadMenu();
        }
      )
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, MenuItemRow[]>();
    for (const it of items) {
      const key = (it.variant_group ?? "Lainnya").trim() || "Lainnya";
      const arr = map.get(key) ?? [];
      arr.push(it);
      map.set(key, arr);
    }
    return Array.from(map.entries()).map(([groupName, groupItems]) => ({
      groupName,
      groupItems,
    }));
  }, [items]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }
      return next;
    });
  };

  // Kalau tableNumber null, UI tidak perlu render berat
  if (tableNumber == null) {
    return (
      <main className="mx-auto min-h-screen max-w-md p-6">
        <p className="text-sm opacity-80">Mengarahkan ke pilih meja...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-md p-6 space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Menu</h1>
          <p className="text-sm text-muted-foreground">Meja {tableNumber}</p>
        </div>

        <Button onClick={() => router.push("/keranjang")} className="shrink-0">
          Keranjang ({itemCount})
        </Button>
      </header>

      {/* Tabs */}
      <div className="rounded-xl bg-muted p-1 flex">
        <button
          type="button"
          onClick={() => setActiveTab("makanan")}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
            activeTab === "makanan" ? "bg-background shadow" : "opacity-70 hover:opacity-100"
          }`}
        >
          Makanan
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("minuman")}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
            activeTab === "minuman" ? "bg-background shadow" : "opacity-70 hover:opacity-100"
          }`}
        >
          Minuman
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari menu..."
          className="pl-10"
        />
      </div>

      <div className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm"
          onClick={loadMenu} 
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading menu...</p>
        </div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">Menu kosong / tidak tersedia.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {grouped.map(({ groupName, groupItems }) => {
            const isExpanded = expandedGroups.has(groupName);
            
            return (
              <div
                key={groupName}
                className="rounded-xl border bg-card overflow-hidden"
              >
                {/* Accordion Header */}
                <button
                  type="button"
                  onClick={() => toggleGroup(groupName)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{groupName}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {groupItems.length}
                    </span>
                  </div>
                  <ChevronDown 
                    className={`h-5 w-5 transition-transform duration-200 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Accordion Content */}
                {isExpanded && (
                  <div className="border-t">
                    {groupItems.map((it, idx) => (
                      <div
                        key={it.id}
                        className={`p-4 ${
                          idx !== groupItems.length - 1 ? "border-b" : ""
                        }`}
                      >
                        <div className="flex gap-3">
                          {/* Image Thumbnail */}
                          <div className="shrink-0 relative w-20 h-20">
                            {it.image_url ? (
                              <Image
                                src={it.image_url}
                                alt={it.name}
                                fill
                                className="rounded-lg object-cover"
                                sizes="80px"
                                onError={(e) => {
                                  // Fallback jika image gagal load
                                  e.currentTarget.style.display = "none";
                                  const parent = e.currentTarget.parentElement;
                                  if (parent) {
                                    parent.innerHTML = '<div class="w-20 h-20 rounded-lg bg-muted flex items-center justify-center text-2xl">🍽️</div>';
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center text-2xl">
                                🍽️
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 space-y-2">
                            <div>
                              <h4 className="font-semibold text-sm">{it.name}</h4>
                              {it.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                  {it.description}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-sm">
                                {formatRupiah(it.price)}
                              </span>

                              <Button
                                size="sm"
                                onClick={() => {
                                  addItem({
                                    id: it.id,
                                    name: it.name,
                                    price: it.price,
                                    quantity: 1,
                                    image_url: it.image_url ?? undefined,
                                  });
                                  toast.success(`${it.name} ditambahkan ke keranjang`);
                                }}
                              >
                                Tambah
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}