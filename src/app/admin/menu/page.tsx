"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type AdminRole = "kasir" | "owner";

type Category = { id: string; name: string };

type MenuItemRow = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  created_at: string;
  categories?: { name: string } | null;
};

const formSchema = z.object({
  id: z.string().optional(),
  categoryId: z.string().min(1, "Kategori wajib diisi"),
  name: z.string().min(1, "Nama wajib diisi"),
  description: z.string().optional(),
  price: z.number().min(0, "Harga minimal 0"),
  imageUrl: z.string().optional(),
  isAvailable: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

function safeMessage(json: unknown, fallback: string) {
  if (typeof json === "object" && json !== null && "message" in json) {
    return String((json as Record<string, unknown>).message);
  }
  return fallback;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isMeResponse(v: unknown): v is { role: AdminRole } {
  if (!isObject(v)) return false;
  const role = v.role;
  return role === "kasir" || role === "owner";
}

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItemRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  // ✅ role admin (kasir/owner)
  const [role, setRole] = useState<AdminRole | null>(null);

  const isOwner = role === "owner";

  const createForm = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryId: "",
      name: "",
      description: "",
      price: 0,
      imageUrl: "",
      isAvailable: true,
    },
  });

  const editForm = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: "",
      categoryId: "",
      name: "",
      description: "",
      price: 0,
      imageUrl: "",
      isAvailable: true,
    },
  });

  const groupedItems = useMemo(() => {
    const s = q.trim().toLowerCase();
    const filtered = s ? items.filter((x) => x.name.toLowerCase().includes(s)) : items;

    const grouped: Record<string, MenuItemRow[]> = {};
    filtered.forEach((item) => {
      const catName = item.categories?.name ?? "Tanpa Kategori";
      if (!grouped[catName]) grouped[catName] = [];
      grouped[catName].push(item);
    });

    return grouped;
  }, [items, q]);

  const load = async () => {
    setLoading(true);
    try {
      const [resMe, resMenu, resCat] = await Promise.all([
        fetch(`/api/admin/me?t=${Date.now()}`, { cache: "no-store" }),
        fetch(`/api/admin/menu-items?t=${Date.now()}`, { cache: "no-store" }),
        fetch(`/api/admin/categories?t=${Date.now()}`, { cache: "no-store" }),
      ]);

      // role
      const textMe = await resMe.text();
      const jsonMe: unknown = textMe ? JSON.parse(textMe) : null;
      if (resMe.ok && isMeResponse(jsonMe)) {
        setRole(jsonMe.role);
      } else if (resMe.status === 401) {
        // tidak login admin
        setRole(null);
      }

      // menu
      const textMenu = await resMenu.text();
      const jsonMenu: unknown = textMenu ? JSON.parse(textMenu) : null;

      // categories
      const textCat = await resCat.text();
      const jsonCat: unknown = textCat ? JSON.parse(textCat) : null;

      if (!resMenu.ok) throw new Error(safeMessage(jsonMenu, "Gagal load menu"));
      if (!resCat.ok) throw new Error(safeMessage(jsonCat, "Gagal load kategori"));

      const menuData = jsonMenu as { items: MenuItemRow[] };
      const catData = jsonCat as { categories: Category[] };

      setItems(menuData.items ?? []);
      setCategories(catData.categories ?? []);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const createMenu = async (values: FormValues) => {
    try {
      const payload = {
        categoryId: values.categoryId,
        name: values.name,
        description: values.description ?? "",
        price: values.price,
        imageUrl: values.imageUrl ?? "",
        isAvailable: values.isAvailable,
      };

      const res = await fetch("/api/admin/menu-items/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      const json: unknown = text ? JSON.parse(text) : null;

      if (!res.ok) throw new Error(safeMessage(json, "Gagal create menu"));

      toast.success("Menu berhasil dibuat");
      setOpenCreate(false);
      createForm.reset({
        categoryId: "",
        name: "",
        description: "",
        price: 0,
        imageUrl: "",
        isAvailable: true,
      });
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  };

  const openEditDialog = (it: MenuItemRow) => {
    editForm.reset({
      id: it.id,
      categoryId: it.category_id,
      name: it.name,
      description: it.description ?? "",
      price: Number(it.price),
      imageUrl: it.image_url ?? "",
      isAvailable: it.is_available,
    });
    setOpenEdit(true);
  };

  const updateMenu = async (values: FormValues) => {
    try {
      const id = values.id ?? "";
      if (!id) {
        toast.error("ID menu tidak ditemukan");
        return;
      }

      const payload = {
        id,
        categoryId: values.categoryId,
        name: values.name,
        description: values.description ?? "",
        price: values.price,
        imageUrl: values.imageUrl ?? "",
        isAvailable: values.isAvailable,
      };

      const res = await fetch("/api/admin/menu-items/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      const json: unknown = text ? JSON.parse(text) : null;

      if (!res.ok) throw new Error(safeMessage(json, "Gagal update menu"));

      toast.success("Menu berhasil diupdate");
      setOpenEdit(false);
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  };

  const openDeleteDialog = (id: string) => {
    setDeleteId(id);
  };

  const executeDelete = async () => {
    if (!deleteId) return;

    try {
      const res = await fetch("/api/admin/menu-items/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: deleteId }),
        cache: "no-store",
      });

      const text = await res.text();
      const json = text ? (JSON.parse(text) as { message?: string }) : {};
      if (!res.ok) throw new Error(json.message ?? "Gagal arsip menu");

      toast.success("Menu berhasil diarsipkan");
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error arsip menu");
    } finally {
      setDeleteId(null);
    }
  };

  const toggleAvailability = async (id: string, next: boolean) => {
    try {
      const found = items.find((x) => x.id === id);
      if (!found) {
        toast.error("Menu tidak ditemukan");
        return;
      }

      const res = await fetch("/api/admin/menu-items/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          categoryId: found.category_id,
          name: found.name,
          description: found.description ?? "",
          price: found.price ?? 0,
          imageUrl: found.image_url ?? "",
          isAvailable: next,
        }),
      });

      const text = await res.text();
      const json: unknown = text ? JSON.parse(text) : null;

      if (!res.ok) throw new Error(safeMessage(json, "Gagal update availability"));

      toast.success(next ? "Menu diaktifkan" : "Menu diset habis");
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  };

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Kelola Menu</h1>
            <p className="mt-2 text-sm text-muted-foreground">Tambah, edit, arsip, atau atur ketersediaan menu</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Link href="/admin" className="flex-1 sm:flex-none">
              <Button variant="outline" className="w-full sm:w-auto bg-transparent">
                Kembali ke Dashboard
              </Button>
            </Link>

            <Button variant="secondary" onClick={load} disabled={loading} className="flex-1 sm:flex-none">
              {loading ? "Loading..." : "Refresh"}
            </Button>

            <Link href="/admin/archived-menu">
              <Button variant="outline">Lihat Arsip</Button>
            </Link>

            {/* CREATE */}
            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
              <DialogTrigger asChild>
                <Button className="flex-1 sm:flex-none">Tambah Menu</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg w-[95vw]">
                <DialogHeader>
                  <DialogTitle>Tambah Menu Baru</DialogTitle>
                </DialogHeader>

                <form className="space-y-3" onSubmit={createForm.handleSubmit(createMenu)}>
                  <div className="space-y-1">
                    <Label>Kategori</Label>
                    <Select
                      value={createForm.watch("categoryId")}
                      onValueChange={(val) => createForm.setValue("categoryId", val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-destructive">{createForm.formState.errors.categoryId?.message}</p>
                  </div>

                  <div className="space-y-1">
                    <Label>Nama Menu</Label>
                    <Input {...createForm.register("name")} placeholder="Contoh: Nasi Menchi Saus BBQ" />
                    <p className="text-xs text-destructive">{createForm.formState.errors.name?.message}</p>
                  </div>

                  <div className="space-y-1">
                    <Label>Harga (Rp)</Label>
                    <Input type="number" {...createForm.register("price", { valueAsNumber: true })} placeholder="0" />
                    <p className="text-xs text-destructive">{createForm.formState.errors.price?.message}</p>
                  </div>

                  <div className="space-y-1">
                    <Label>Deskripsi</Label>
                    <Textarea {...createForm.register("description")} placeholder="Deskripsi menu (opsional)" rows={3} />
                  </div>

                  <div className="space-y-1">
                    <Label>Image URL</Label>
                    <Input {...createForm.register("imageUrl")} placeholder="https://..." />
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Switch
                      checked={createForm.watch("isAvailable")}
                      onCheckedChange={(v) => createForm.setValue("isAvailable", v)}
                    />
                    <span className="text-sm">Menu Tersedia</span>
                  </div>

                  <DialogFooter className="pt-4">
                    <Button type="submit" className="w-full">
                      Simpan Menu
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

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

        {loading ? (
          <Card className="p-6">
            <p className="text-center text-muted-foreground">Loading...</p>
          </Card>
        ) : Object.keys(groupedItems).length === 0 ? (
          <Card className="p-6">
            <p className="text-center text-muted-foreground">
              {items.length === 0 ? "Tidak ada menu." : "Tidak ada menu yang sesuai pencarian."}
            </p>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedItems).map(([categoryName, categoryItems]) => (
              <div key={categoryName} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{categoryName}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {categoryItems.length} item{categoryItems.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-sm">
                    {categoryItems.filter((x) => x.is_available).length} / {categoryItems.length} Tersedia
                  </Badge>
                </div>

                <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {categoryItems.map((it) => (
                    <Card
                      key={it.id}
                      className="p-4 space-y-3 flex flex-col hover:shadow-md transition-shadow border-l-4 border-l-primary"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-sm">{it.name}</h3>
                          </div>
                          <Badge variant={it.is_available ? "secondary" : "destructive"} className="text-xs">
                            {it.is_available ? "Tersedia" : "Habis"}
                          </Badge>
                        </div>

                        {it.description && <p className="text-xs text-muted-foreground line-clamp-2">{it.description}</p>}

                        <p className="text-sm font-bold text-primary">
                          Rp {Number(it.price).toLocaleString("id-ID")}
                        </p>
                      </div>

                      {/* ✅ ACTIONS */}
                      <div className="flex flex-col gap-2 pt-2">
                        {/* baris 1 */}
                        <div className="flex flex-col sm:flex-row gap-2">
                          {it.is_available ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => void toggleAvailability(it.id, false)}
                              className="flex-1 text-xs"
                            >
                              Set Habis
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => void toggleAvailability(it.id, true)} className="flex-1 text-xs">
                              Aktifkan
                            </Button>
                          )}

                          <Button variant="outline" size="sm" onClick={() => openEditDialog(it)} className="flex-1 text-xs">
                            Edit
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openDeleteDialog(it.id)}
                            className="flex-1 text-xs"
                          >
                            Arsip
                          </Button>
                        </div>

                        {/* ✅ baris 2: OWNER ONLY */}
                        {isOwner && (
                          <Link href={`/admin/menu/${it.id}/recipe`} className="block">
                            <Button variant="outline" size="sm" className="w-full text-xs">
                              Atur Resep
                            </Button>
                          </Link>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EDIT DIALOG */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="max-w-lg w-[95vw]">
          <DialogHeader>
            <DialogTitle>Edit Menu</DialogTitle>
          </DialogHeader>

          <form className="space-y-3" onSubmit={editForm.handleSubmit(updateMenu)}>
            <div className="space-y-1">
              <Label>Kategori</Label>
              <Select value={editForm.watch("categoryId")} onValueChange={(val) => editForm.setValue("categoryId", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-destructive">{editForm.formState.errors.categoryId?.message}</p>
            </div>

            <div className="space-y-1">
              <Label>Nama Menu</Label>
              <Input {...editForm.register("name")} />
              <p className="text-xs text-destructive">{editForm.formState.errors.name?.message}</p>
            </div>

            <div className="space-y-1">
              <Label>Harga (Rp)</Label>
              <Input type="number" {...editForm.register("price", { valueAsNumber: true })} />
              <p className="text-xs text-destructive">{editForm.formState.errors.price?.message}</p>
            </div>

            <div className="space-y-1">
              <Label>Deskripsi</Label>
              <Textarea {...editForm.register("description")} rows={3} />
            </div>

            <div className="space-y-1">
              <Label>Image URL</Label>
              <Input {...editForm.register("imageUrl")} />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Switch checked={editForm.watch("isAvailable")} onCheckedChange={(v) => editForm.setValue("isAvailable", v)} />
              <span className="text-sm">Menu Tersedia</span>
            </div>

            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full">
                Update Menu
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="w-[95vw]">
          <AlertDialogHeader>
            <AlertDialogTitle>Arsip Menu?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak bisa dibatalkan. Menu akan diarsipkan jika sudah pernah dipesan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-destructive hover:bg-destructive/90">
              Arsip Sekarang
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
