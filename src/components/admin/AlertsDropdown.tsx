"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RestockModal from "@/components/admin/RestockModal";
import { supabaseBrowser } from "@/lib/supabase/browser";
import {
  AlertTriangle,
  XCircle,
  Package,
  ChevronDown,
  ChevronUp,
  Bell,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

// --- TYPES (Sama seperti sebelumnya) ---
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

type MenuAlert = {
  id: string;
  name: string;
  status: AlertType;
  ingredients: {
    id: string;
    name: string;
    unit: string;
    current_stock: number;
    min_stock: number;
  }[];
};

type AlertsResponse = {
  count: number;
  outOfStockCount: number;
  lowStockCount: number;
  outOfStockItems: AlertItem[];
  lowStockItems: AlertItem[];
  items: AlertItem[];
  menuAlerts: MenuAlert[];
  menuOutOfStockCount: number;
  menuLowStockCount: number;
  hasUrgent: boolean;
};

// --- HELPER FUNCTIONS (Logic Parsing Tetap Sama) ---
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

function parseAlertItems(rawItems: unknown[]): AlertItem[] {
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
  return items;
}

function parseMenuAlerts(rawItems: unknown[]): MenuAlert[] {
  const items: MenuAlert[] = [];
  for (const it of rawItems) {
    if (!isObject(it)) continue;

    const id = typeof it.id === "string" ? it.id : "";
    const name = typeof it.name === "string" ? it.name : "";
    const status = isAlertType(it.status) ? it.status : "low_stock";

    const rawIngredients = Array.isArray(it.ingredients) ? it.ingredients : [];
    const ingredients = rawIngredients
      .filter(isObject)
      .map((ing) => ({
        id: typeof ing.id === "string" ? ing.id : "",
        name: typeof ing.name === "string" ? ing.name : "",
        unit: typeof ing.unit === "string" ? ing.unit : "",
        current_stock: toNum(ing.current_stock),
        min_stock: toNum(ing.min_stock),
      }))
      .filter((i) => i.id && i.name);

    if (id && name) {
      items.push({ id, name, status, ingredients });
    }
  }
  return items;
}

function parseResponse(v: unknown): AlertsResponse {
  const defaultResponse: AlertsResponse = {
    count: 0,
    outOfStockCount: 0,
    lowStockCount: 0,
    outOfStockItems: [],
    lowStockItems: [],
    items: [],
    menuAlerts: [],
    menuOutOfStockCount: 0,
    menuLowStockCount: 0,
    hasUrgent: false,
  };

  if (!isObject(v)) return defaultResponse;

  const count = toNum(v.count);
  const outOfStockCount = toNum(v.outOfStockCount);
  const lowStockCount = toNum(v.lowStockCount);
  const menuOutOfStockCount = toNum(v.menuOutOfStockCount);
  const menuLowStockCount = toNum(v.menuLowStockCount);
  const hasUrgent = v.hasUrgent === true;

  const outOfStockItems = parseAlertItems(
    Array.isArray(v.outOfStockItems) ? v.outOfStockItems : [],
  );
  const lowStockItems = parseAlertItems(
    Array.isArray(v.lowStockItems) ? v.lowStockItems : [],
  );
  const items = parseAlertItems(Array.isArray(v.items) ? v.items : []);
  const menuAlerts = parseMenuAlerts(
    Array.isArray(v.menuAlerts) ? v.menuAlerts : [],
  );

  return {
    count,
    outOfStockCount,
    lowStockCount,
    outOfStockItems,
    lowStockItems,
    items,
    menuAlerts,
    menuOutOfStockCount,
    menuLowStockCount,
    hasUrgent,
  };
}

// --- MAIN COMPONENT ---
export default function AlertsDropdown({
  refreshMs = 15000,
}: {
  refreshMs?: number;
}) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<AlertsResponse>({
    count: 0,
    outOfStockCount: 0,
    lowStockCount: 0,
    outOfStockItems: [],
    lowStockItems: [],
    items: [],
    menuAlerts: [],
    menuOutOfStockCount: 0,
    menuLowStockCount: 0,
    hasUrgent: false,
  });
  const [showMenus, setShowMenus] = useState(false);
  const [loading, setLoading] = useState(false);

  const [openRestock, setOpenRestock] = useState<null | {
    id: string;
    name: string;
    unit: string;
    current: number;
  }>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/alerts?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const json: unknown = await res.json().catch(() => null);
      setData(parseResponse(json));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), refreshMs);
    return () => window.clearInterval(id);
  }, [refreshMs]);

  // Realtime listener
  useEffect(() => {
    const chan = supabaseBrowser
      .channel("alerts-listener")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ingredients" },
        () => void load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "stock_alerts" },
        () => void load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "menu_recipes" },
        () => void load(),
      )
      .subscribe();

    return () => void supabaseBrowser.removeChannel(chan);
  }, []);

  useEffect(() => {
    if (open) void load();
  }, [open]);

  // Derived state
  const menuOutOfStock = useMemo(
    () => data.menuAlerts.filter((m) => m.status === "out_of_stock"),
    [data.menuAlerts],
  );
  const menuLowStock = useMemo(
    () => data.menuAlerts.filter((m) => m.status === "low_stock"),
    [data.menuAlerts],
  );

  const totalIngredients = data.count;
  const totalMenus = data.menuAlerts.length;

  return (
    <div className="relative">
      {/* TRIGGER BUTTON */}
      <Button
        variant="outline"
        onClick={() => setOpen((v) => !v)}
        className={`relative h-10 border-border/60 hover:bg-background ${
          open
            ? "bg-amber-50 border-amber-200 text-amber-900"
            : "bg-background/50"
        }`}
      >
        <Bell
          className={`w-4 h-4 mr-2 ${data.hasUrgent ? "text-destructive" : "text-foreground"}`}
        />
        <span>Alerts</span>

        {totalIngredients > 0 && (
          <Badge
            variant="secondary"
            className={`ml-2 h-5 px-1.5 min-w-[20px] justify-center ${
              data.hasUrgent
                ? "bg-destructive text-destructive-foreground hover:bg-destructive"
                : "bg-amber-600 text-white hover:bg-amber-700"
            }`}
          >
            {totalIngredients}
          </Badge>
        )}

        {/* Pulse Dot for Urgent */}
        {data.hasUrgent && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive/60 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive border-2 border-background"></span>
          </span>
        )}
      </Button>

      {/* DROPDOWN PANEL */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute right-0 mt-3 w-[90vw] sm:w-[420px] z-50 animate-in fade-in zoom-in-95 duration-200">
            <Card className="shadow-xl border-border/50 bg-white/95 backdrop-blur-md overflow-hidden rounded-2xl ring-1 ring-black/5">
              {/* Header */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50/80 to-orange-50/80 border-b border-amber-100/50">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl shadow-sm ${
                      data.hasUrgent
                        ? "bg-destructive text-destructive-foreground"
                        : data.lowStockCount > 0
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {data.hasUrgent ? (
                      <AlertCircle className="w-5 h-5" />
                    ) : data.lowStockCount > 0 ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm">
                      Notifikasi Stok
                    </h3>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      {totalIngredients > 0
                        ? `${totalIngredients} bahan • ${totalMenus} menu terdampak`
                        : "Semua stok aman terkendali"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-white/50"
                    onClick={() => void load()}
                    disabled={loading}
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-white/50"
                    onClick={() => setOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Content Scroll Area */}
              <div className="max-h-[65vh] overflow-y-auto custom-scrollbar bg-background/50">
                {totalIngredients === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 ring-8 ring-emerald-50/50">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h4 className="font-semibold text-foreground">Stok Aman</h4>
                    <p className="text-sm text-muted-foreground max-w-[200px] mt-1">
                      Tidak ada bahan yang perlu di-restock saat ini.
                    </p>
                  </div>
                ) : (
                  <div className="p-2 space-y-3">
                    {/* HABIS (Urgent) */}
                    {data.outOfStockItems.length > 0 && (
                      <div className="rounded-xl border border-destructive/20 bg-destructive/5 overflow-hidden">
                        <div className="px-4 py-2.5 bg-destructive/10 flex items-center justify-between border-b border-destructive/10">
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-destructive" />
                            <span className="text-xs font-bold text-destructive uppercase tracking-wide">
                              Stok Habis
                            </span>
                          </div>
                          <Badge
                            variant="destructive"
                            className="h-5 px-1.5 text-[10px]"
                          >
                            {data.outOfStockItems.length}
                          </Badge>
                        </div>
                        <div className="divide-y divide-destructive/10">
                          {data.outOfStockItems.map((item) => (
                            <div
                              key={item.id}
                              className="p-3 flex items-center justify-between gap-3 hover:bg-white/40 transition-colors"
                            >
                              <div className="min-w-0">
                                <p className="font-semibold text-sm text-foreground">
                                  {item.ingredient.name}
                                </p>
                                <p className="text-xs text-destructive font-medium mt-0.5">
                                  Stok: 0 {item.ingredient.unit}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                className="h-8 bg-destructive hover:bg-destructive/90 text-white shadow-sm text-xs px-3"
                                onClick={() =>
                                  setOpenRestock({
                                    id: item.ingredient.id,
                                    name: item.ingredient.name,
                                    unit: item.ingredient.unit,
                                    current: item.ingredient.current_stock,
                                  })
                                }
                              >
                                Restock
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* MENIPIS (Warning) - Menggunakan warna Earth Tone (Amber/Primary) */}
                    {data.lowStockItems.length > 0 && (
                      <div className="rounded-xl border border-amber-200/60 bg-amber-50/30 overflow-hidden">
                        <div className="px-4 py-2.5 bg-amber-100/50 flex items-center justify-between border-b border-amber-200/50">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-700" />
                            <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">
                              Stok Menipis
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className="h-5 px-1.5 text-[10px] bg-amber-100 text-amber-800 border-amber-200"
                          >
                            {data.lowStockItems.length}
                          </Badge>
                        </div>
                        <div className="divide-y divide-amber-200/30">
                          {data.lowStockItems.map((item) => (
                            <div
                              key={item.id}
                              className="p-3 flex items-center justify-between gap-3 hover:bg-amber-50/50 transition-colors"
                            >
                              <div className="min-w-0">
                                <p className="font-semibold text-sm text-foreground">
                                  {item.ingredient.name}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                  <span className="text-amber-700 font-medium bg-amber-100/50 px-1.5 py-0.5 rounded">
                                    Sisa: {item.ingredient.current_stock}{" "}
                                    {item.ingredient.unit}
                                  </span>
                                  <span>•</span>
                                  <span>Min: {item.ingredient.min_stock}</span>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 border-amber-200 text-amber-800 hover:bg-amber-100 hover:text-amber-900 text-xs px-3 bg-white"
                                onClick={() =>
                                  setOpenRestock({
                                    id: item.ingredient.id,
                                    name: item.ingredient.name,
                                    unit: item.ingredient.unit,
                                    current: item.ingredient.current_stock,
                                  })
                                }
                              >
                                Restock
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* MENU TERDAMPAK (Collapsible) */}
                    {totalMenus > 0 && (
                      <div className="mt-2 rounded-xl border border-border/50 bg-card overflow-hidden">
                        <button
                          onClick={() => setShowMenus(!showMenus)}
                          className="w-full flex items-center justify-between p-3 bg-muted/20 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-md bg-secondary/10 text-secondary">
                              <Package className="w-4 h-4" />
                            </div>
                            <div className="text-left">
                              <p className="text-xs font-bold text-foreground">
                                Menu Terdampak
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {menuOutOfStock.length > 0 && (
                                  <span className="text-destructive font-medium">
                                    {menuOutOfStock.length} Tidak Tersedia
                                  </span>
                                )}
                                {menuOutOfStock.length > 0 &&
                                  menuLowStock.length > 0 &&
                                  ", "}
                                {menuLowStock.length > 0 && (
                                  <span className="text-amber-700 font-medium">
                                    {menuLowStock.length} Terbatas
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          {showMenus ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>

                        {showMenus && (
                          <div className="p-3 bg-white border-t border-border/50 space-y-3">
                            {menuOutOfStock.length > 0 && (
                              <div>
                                <p className="text-[10px] font-bold text-destructive mb-2 uppercase">
                                  Tidak Bisa Dipesan
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {menuOutOfStock.map((m) => (
                                    <span
                                      key={m.id}
                                      className="px-2 py-1 rounded-md bg-destructive/5 text-destructive border border-destructive/10 text-[10px] font-medium"
                                    >
                                      {m.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {menuLowStock.length > 0 && (
                              <div>
                                <p className="text-[10px] font-bold text-amber-700 mb-2 uppercase">
                                  Stok Terbatas
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {menuLowStock.map((m) => (
                                    <span
                                      key={m.id}
                                      className="px-2 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-medium"
                                    >
                                      {m.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              {totalIngredients > 0 && (
                <div className="p-3 bg-muted/20 border-t border-border/50 text-center">
                  <p className="text-[10px] text-muted-foreground">
                    Data diperbarui otomatis (Live)
                  </p>
                </div>
              )}
            </Card>
          </div>
        </>
      )}

      {/* RESTOCK MODAL */}
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
