"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { MenuItemRow } from "@/components/menu/constants";

type MenuItemsResponse = {
  items: MenuItemRow[];
  message?: string;
};

function safeMessage(v: unknown, fallback: string) {
  if (typeof v === "object" && v !== null && "message" in v) {
    return String((v as Record<string, unknown>).message);
  }
  return fallback;
}

export function useMenuItems({
  categoryId,
  query,
}: {
  categoryId: string;
  query: string;
}) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MenuItemRow[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // biar gak setState setelah unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL("/api/menu-items", window.location.origin);
      url.searchParams.set("category_id", categoryId);
      if (query.trim()) url.searchParams.set("q", query.trim());

      const res = await fetch(url.toString(), {
        method: "GET",
        cache: "no-store",
        headers: { "cache-control": "no-cache" },
      });

      const json: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(safeMessage(json, "Gagal ambil menu"));
      }

      const data = json as MenuItemsResponse;
      const loadedItems = Array.isArray(data.items) ? data.items : [];

      if (!mountedRef.current) return;

      setItems(loadedItems);

      // auto expand 1 group pertama (kalau reset)
      if (loadedItems.length > 0) {
        setExpandedGroups((prev) => {
          if (prev.size > 0) return prev;
          const firstGroup = (loadedItems[0].variant_group ?? "Lainnya").trim() || "Lainnya";
          return new Set([firstGroup]);
        });
      }
    } catch (e: unknown) {
      if (!mountedRef.current) return;
      toast.error(e instanceof Error ? e.message : "Terjadi error");
      setItems([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [categoryId, query]);

  // 1) reload saat category berubah (reset expand)
  useEffect(() => {
    setExpandedGroups(new Set());
    void refresh();
  }, [categoryId, refresh]);

  // 2) debounce saat query berubah
  useEffect(() => {
    const t = window.setTimeout(() => {
      void refresh();
    }, 350);

    return () => window.clearTimeout(t);
  }, [query, refresh]);

  // 3) realtime - refresh saat menu_items berubah
  useEffect(() => {
    const channel = supabaseBrowser
      .channel("realtime-menu-items")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "menu_items" }, () => void refresh())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "menu_items" }, () => void refresh())
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "menu_items" }, () => void refresh())
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, [refresh]);

  const toggleGroup = useCallback((groupName: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupName)) next.delete(groupName);
      else next.add(groupName);
      return next;
    });
  }, []);

  return useMemo(
    () => ({
      loading,
      items,
      expandedGroups,
      toggleGroup,
      refresh,
    }),
    [loading, items, expandedGroups, toggleGroup, refresh]
  );
}
