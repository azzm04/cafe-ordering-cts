"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { MenuItem } from "@/types";
import Link from "next/link";

type AdminMenuItem = MenuItem & {
  categories?: { name: string } | null;
};

export default function AdminMenuPage() {
  const [items, setItems] = useState<AdminMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((x) => x.name.toLowerCase().includes(s));
  }, [items, q]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/menu-items?t=${Date.now()}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as unknown;

      if (!res.ok) throw new Error("Gagal load menu");

      const data = json as { items: AdminMenuItem[] };
      setItems(data.items ?? []);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const toggle = async (id: string, next: boolean) => {
    try {
      const res = await fetch("/api/admin/menu-items/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isAvailable: next }),
      });
      const json = (await res.json()) as unknown;

      if (!res.ok) {
        const msg =
          typeof json === "object" && json !== null && "message" in json
            ? String((json as Record<string, unknown>).message)
            : "Gagal update";
        throw new Error(msg);
      }

      toast.success(next ? "Menu diaktifkan" : "Menu diset habis");
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  };

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Kelola Menu</h1>
          <p className="text-sm opacity-70">
            Tampilkan/sembunyikan menu untuk customer.
          </p>
        </div>

        <div className="flex gap-2">
          <Link href="/admin">
            <Button variant="outline">Kembali ke Dashboard</Button>
          </Link>

          <Button variant="secondary" onClick={load} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Cari menu..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {loading ? (
          <p className="text-sm opacity-70">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm opacity-70">Tidak ada menu.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((it) => (
              <div
                key={it.id}
                className="flex items-center justify-between gap-3 border-b pb-3"
              >
                <div className="space-y-1">
                  <div className="font-medium">{it.name}</div>
                  <div className="text-xs opacity-70">
                    {it.categories?.name ?? "-"} • Rp{" "}
                    {Number(it.price).toLocaleString("id-ID")}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={it.is_available ? "secondary" : "destructive"}
                  >
                    {it.is_available ? "available" : "sold out"}
                  </Badge>

                  {it.is_available ? (
                    <Button
                      variant="outline"
                      onClick={() => toggle(it.id, false)}
                    >
                      Set Habis
                    </Button>
                  ) : (
                    <Button onClick={() => toggle(it.id, true)}>
                      Aktifkan
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </main>
  );
}
