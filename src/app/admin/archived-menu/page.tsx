"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BackgroundDecorations from "@/components/shared/BackgroundDecorations";
import { Input } from "@/components/ui/input";
import { formatRupiah } from "@/lib/utils";

type CategoryRow = {
  id: string;
  name: string;
  parent_id: string | null;
};

type ArchivedMenuItem = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_archived: boolean;
  created_at: string;
  variant_group: string | null;
  categories?: CategoryRow | null; 
};

type ApiResponse = {
  items: ArchivedMenuItem[];
  message?: string;
};

function safeMessage(json: unknown, fallback: string) {
  if (typeof json === "object" && json !== null && "message" in json) {
    return String((json as Record<string, unknown>).message);
  }
  return fallback;
}

export default function AdminArchivedMenuPage() {
  const [q, setQ] = useState<string>("");
  const [items, setItems] = useState<ArchivedMenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchArchived = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/admin/menu-items", window.location.origin);
      url.searchParams.set("archived", "1");
      if (q.trim()) url.searchParams.set("q", q.trim());

      const res = await fetch(url.toString(), { cache: "no-store" });
      const json = (await res.json()) as unknown;

      if (!res.ok) throw new Error(safeMessage(json, "Gagal load menu arsip"));

      const data = json as ApiResponse;
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchArchived();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // debounce search
  useEffect(() => {
    const t = window.setTimeout(() => void fetchArchived(), 300);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const groupedItems = useMemo(() => {
    const grouped: Record<string, ArchivedMenuItem[]> = {};
    for (const it of items) {
      const catName = it.categories?.name ?? "Tanpa Kategori";
      if (!grouped[catName]) grouped[catName] = [];
      grouped[catName].push(it);
    }

    // Sort item by created_at desc di setiap kategori
    for (const k of Object.keys(grouped)) {
      grouped[k].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    return grouped;
  }, [items]);

  const restoreItem = async (id: string) => {
    try {
      const res = await fetch("/api/admin/menu-items/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const json = (await res.json()) as unknown;
      if (!res.ok) throw new Error(safeMessage(json, "Gagal memulihkan menu"));

      toast.success("Menu dipulihkan (nonaktif). Aktifkan dari Kelola Menu.");
      await fetchArchived();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  };

  const total = items.length;

  const categoryEntries = useMemo(() => {
    // Sort kategori A-Z biar rapih
    return Object.entries(groupedItems).sort(([a], [b]) =>
      a.localeCompare(b, "id-ID")
    );
  }, [groupedItems]);

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden">
      <BackgroundDecorations />
      <div className="relative z-10 mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Menu Diarsipkan
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Menu yang diarsipkan (soft delete). Bisa dipulihkan kapan saja.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Link href="/admin/menu" className="flex-1 sm:flex-none">
              <Button variant="outline" className="w-full sm:w-auto bg-transparent">
                Kembali ke Kelola Menu
              </Button>
            </Link>
            <Button
              variant="secondary"
              onClick={() => void fetchArchived()}
              disabled={loading}
              className="flex-1 sm:flex-none"
            >
              {loading ? "Loading..." : "Refresh"}
            </Button>
          </div>
        </div>

        {/* Search */}
        <Card className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
            <Input
              placeholder="Cari nama menu..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full md:max-w-xl"
            />
            <div className="text-sm opacity-70 md:text-right">
              Total: <span className="font-semibold">{total}</span> item arsip
            </div>
          </div>
        </Card>

        {/* Content */}
        {loading ? (
          <Card className="p-6">
            <p className="text-center text-muted-foreground">Loading...</p>
          </Card>
        ) : total === 0 ? (
          <Card className="p-6">
            <p className="text-center text-muted-foreground">
              Tidak ada menu yang diarsipkan.
            </p>
          </Card>
        ) : (
          <div className="space-y-8">
            {categoryEntries.map(([categoryName, categoryItems]) => (
              <div key={categoryName} className="space-y-4">
                {/* Category Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                      {categoryName}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {categoryItems.length} item
                    </p>
                  </div>

                  <Badge variant="outline" className="text-sm">
                    {categoryItems.length} / {categoryItems.length} Arsip
                  </Badge>
                </div>

                {/* Grid */}
                <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {categoryItems.map((it) => (
                    <Card
                      key={it.id}
                      className="p-4 space-y-3 flex flex-col hover:shadow-md transition-shadow border-l-4 border-l-primary"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm truncate">{it.name}</h3>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="secondary" className="text-xs">
                              Arsip
                            </Badge>
                            <Badge variant="destructive" className="text-xs">
                              Habis
                            </Badge>
                          </div>
                        </div>

                        {it.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {it.description}
                          </p>
                        )}

                        <p className="text-sm font-bold text-primary">
                          {formatRupiah(Number(it.price))}
                        </p>
                      </div>

                      <div className="pt-2 space-y-2">
                        <Button className="w-full" onClick={() => void restoreItem(it.id)}>
                          Pulihkan
                        </Button>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          * Dipulihkan dalam kondisi <b>nonaktif</b>. Aktifkan dari Kelola Menu.
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
