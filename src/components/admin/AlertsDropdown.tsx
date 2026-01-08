"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RestockModal from "@/components/admin/RestockModal";
import { supabaseBrowser } from "@/lib/supabase/browser";

type AlertType = "low_stock" | "out_of_stock";

type AlertItem = {
  id: string;
  alert_type: AlertType;
  created_at: string;
  message: string | null;
  ingredient: {
    id: string;
    name: string;
    unit: string;
    current_stock: number;
    min_stock: number;
  };
};

type AlertsResponse = {
  count: number;
  items: AlertItem[];
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isAlertType(v: unknown): v is AlertType {
  return v === "low_stock" || v === "out_of_stock";
}

function toNum(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function parseResponse(v: unknown): AlertsResponse {
  if (!isObject(v)) return { count: 0, items: [] };
  const count = typeof v.count === "number" ? v.count : 0;

  const rawItems = Array.isArray(v.items) ? v.items : [];
  const items: AlertItem[] = [];

  for (const it of rawItems) {
    if (!isObject(it)) continue;
    if (!isAlertType(it.alert_type)) continue;

    const ing = it.ingredient;
    if (!isObject(ing)) continue;

    const id = typeof it.id === "string" ? it.id : "";
    const created_at = typeof it.created_at === "string" ? it.created_at : "";
    const message = typeof it.message === "string" ? it.message : null;

    const ingredientId = typeof ing.id === "string" ? ing.id : "";
    const name = typeof ing.name === "string" ? ing.name : "";
    const unit = typeof ing.unit === "string" ? ing.unit : "";

    const current_stock = toNum(ing.current_stock);
    const min_stock = toNum(ing.min_stock);

    if (!id || !ingredientId || !name) continue;

    items.push({
      id,
      alert_type: it.alert_type,
      created_at,
      message,
      ingredient: { id: ingredientId, name, unit, current_stock, min_stock },
    });
  }

  return { count: Number.isFinite(count) ? count : items.length, items };
}

function badgeFor(type: AlertType) {
  return type === "out_of_stock" ? (
    <Badge variant="destructive">Habis</Badge>
  ) : (
    <Badge variant="secondary">Menipis</Badge>
  );
}

export default function AlertsDropdown({ refreshMs = 15000 }: { refreshMs?: number }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<AlertsResponse>({ count: 0, items: [] });

  const [openRestock, setOpenRestock] = useState<null | {
    id: string;
    name: string;
    unit: string;
    current: number;
  }>(null);

  const load = async () => {
    // server route: src/app/api/admin/alert/route.ts -> /api/admin/alert
    const res = await fetch(`/api/admin/alert?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return;
    const json: unknown = await res.json().catch(() => null);
    setData(parseResponse(json));
  };

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), refreshMs);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // subscribe to ingredient/menu/stock_alerts changes and reload on updates
  useEffect(() => {
    const chan = supabaseBrowser
      .channel("alerts-listener")
      .on("postgres_changes", { event: "*", schema: "public", table: "ingredients" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "stock_alerts" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_recipes" }, () => void load())
      .subscribe();

    return () => void supabaseBrowser.removeChannel(chan);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (open) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const count = data.count;
  const items = useMemo(() => data.items, [data.items]);

  return (
    <div className="relative">
      <Button variant="outline" onClick={() => setOpen((v) => !v)} className="bg-transparent">
        Alerts {count > 0 ? <span className="ml-2 text-destructive font-semibold">({count})</span> : null}
      </Button>

      {open ? (
        <div className="absolute right-0 mt-2 w-[92vw] sm:w-[520px] z-50">
          <Card className="p-4 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Bahan Menipis / Habis</div>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Tutup
              </Button>
            </div>

            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tidak ada alert aktif.</p>
            ) : (
              <div className="space-y-2">
                {items.map((a) => (
                  <div
                    key={a.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-md border p-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold">{a.ingredient.name}</div>
                        {badgeFor(a.alert_type)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Stok: <span className="font-medium">{a.ingredient.current_stock}</span> {a.ingredient.unit} • Min:{" "}
                        <span className="font-medium">{a.ingredient.min_stock}</span> {a.ingredient.unit}
                      </div>
                      {a.message ? <div className="text-xs text-muted-foreground">{a.message}</div> : null}
                    </div>

                    <Button
                      variant="secondary"
                      onClick={() =>
                        setOpenRestock({
                          id: a.ingredient.id,
                          name: a.ingredient.name,
                          unit: a.ingredient.unit,
                          current: a.ingredient.current_stock,
                        })
                      }
                    >
                      Restock
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      ) : null}

      <RestockModal
        open={!!openRestock}
        ingredient={openRestock}
        onClose={() => setOpenRestock(null)}
        onSuccess={async () => {
          setOpenRestock(null);
          await load();
        }}
      />
    </div>
  );
}
