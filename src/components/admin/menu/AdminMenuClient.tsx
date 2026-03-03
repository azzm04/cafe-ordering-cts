"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import type { AdminRole, Category, MenuItemRow } from "@/types/admin/menu";
import { fetchAdminMe, fetchCategories, fetchMenuItems, apiArchiveMenu, apiUpdateMenu } from "@/services/admin/menu";
import MenuHeaderActions from "@/components/admin/menu/MenuHeaderActions";
import BackgroundDecorations from "@/components/shared/BackgroundDecorations";
import MenuGrid from "@/components/admin/menu/MenuGrid";
import MenuDialogs from "@/components/admin/menu/MenuDialogs";

export default function AdminMenuClient() {
  const [items, setItems] = useState<MenuItemRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [role, setRole] = useState<AdminRole | null>(null);
  const isOwner = role === "owner";

  // dialogs state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editTarget, setEditTarget] = useState<MenuItemRow | null>(null);

  const groupedItems = useMemo(() => {
    const s = q.trim().toLowerCase();
    const filtered = s ? items.filter((x) => x.name.toLowerCase().includes(s)) : items;

    const grouped: Record<string, MenuItemRow[]> = {};
    for (const item of filtered) {
      const catName = item.categories?.name ?? "Tanpa Kategori";
      (grouped[catName] ??= []).push(item);
    }
    return grouped;
  }, [items, q]);

  const load = async () => {
    setLoading(true);
    try {
      const [me, menu, cats] = await Promise.all([
        fetchAdminMe(),
        fetchMenuItems(),
        fetchCategories(),
      ]);

      setRole(me?.role ?? null);
      setItems(menu);
      setCategories(cats);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openEditDialog = (it: MenuItemRow) => {
    setEditTarget(it);
    setOpenEdit(true);
  };

  const toggleAvailability = async (id: string, next: boolean) => {
    try {
      const found = items.find((x) => x.id === id);
      if (!found) {
        toast.error("Menu tidak ditemukan");
        return;
      }

      await apiUpdateMenu({
        id,
        categoryId: found.category_id,
        name: found.name,
        description: found.description ?? "",
        price: Number(found.price) || 0,
        imageUrl: found.image_url ?? "",
        isAvailable: next,
      });

      toast.success(next ? "Menu diaktifkan" : "Menu diset habis");
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  };

  const executeDelete = async () => {
    if (!deleteId) return;

    try {
      await apiArchiveMenu(deleteId);
      toast.success("Menu berhasil diarsipkan");
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error arsip menu");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden">
      <BackgroundDecorations />

      <div className="relative z-10 mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <MenuHeaderActions
          loading={loading}
          onRefresh={load}
          openCreate={openCreate}
          setOpenCreate={setOpenCreate}
          categories={categories}
          onCreated={async () => {
            setOpenCreate(false);
            await load();
          }}
        />

        <Card className="p-4 space-y-3">
          <Input
            placeholder="Cari menu berdasarkan nama..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full"
          />

          {role && (
            <p className="text-xs text-muted-foreground">
              Login sebagai: <span className="font-semibold">{role}</span>
            </p>
          )}
        </Card>

        <MenuGrid
          loading={loading}
          items={items}
          groupedItems={groupedItems}
          isOwner={isOwner}
          onToggleAvailability={toggleAvailability}
          onEdit={openEditDialog}
          onArchive={(id) => setDeleteId(id)}
        />
      </div>

      <MenuDialogs
        categories={categories}
        openEdit={openEdit}
        setOpenEdit={setOpenEdit}
        editTarget={editTarget}
        onUpdated={async () => {
          setOpenEdit(false);
          setEditTarget(null);
          await load();
        }}
        deleteId={deleteId}
        setDeleteId={setDeleteId}
        onConfirmDelete={executeDelete}
      />
    </main>
  );
}
