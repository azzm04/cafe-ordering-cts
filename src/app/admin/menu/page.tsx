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

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItemRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const createForm = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { categoryId: "", name: "", description: "", price: 0, imageUrl: "", isAvailable: true },
  });

  const editForm = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { id: "", categoryId: "", name: "", description: "", price: 0, imageUrl: "", isAvailable: true },
  });

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((x) => x.name.toLowerCase().includes(s));
  }, [items, q]);

  const load = async () => {
    setLoading(true);
    try {
      const [resMenu, resCat] = await Promise.all([
        fetch(`/api/admin/menu-items?t=${Date.now()}`, { cache: "no-store" }),
        fetch(`/api/admin/categories?t=${Date.now()}`, { cache: "no-store" }),
      ]);

      const textMenu = await resMenu.text();
      const jsonMenu: unknown = textMenu ? JSON.parse(textMenu) : null;

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
      createForm.reset({ categoryId: "", name: "", description: "", price: 0, imageUrl: "", isAvailable: true });
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

  const deleteMenu = async (id: string) => {
    const ok = confirm("Yakin hapus menu ini?");
    if (!ok) return;

    try {
      const res = await fetch("/api/admin/menu-items/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const text = await res.text();
      const json: unknown = text ? JSON.parse(text) : null;

      if (!res.ok) throw new Error(safeMessage(json, "Gagal hapus menu"));

      toast.success("Menu berhasil dihapus");
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  };

  const toggleAvailability = async (id: string, next: boolean) => {
    try {
      const res = await fetch("/api/admin/menu-items/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          categoryId: items.find((x) => x.id === id)?.category_id ?? "",
          name: items.find((x) => x.id === id)?.name ?? "",
          description: items.find((x) => x.id === id)?.description ?? "",
          price: items.find((x) => x.id === id)?.price ?? 0,
          imageUrl: items.find((x) => x.id === id)?.image_url ?? "",
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
    <main className="mx-auto max-w-5xl p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Kelola Menu</h1>
          <p className="text-sm opacity-70">Create, edit, delete, dan set habis menu.</p>
        </div>

        <div className="flex gap-2">
          <Link href="/admin">
            <Button variant="outline">Kembali ke Dashboard</Button>
          </Link>
          <Button variant="secondary" onClick={load} disabled={loading}>
            Refresh
          </Button>

          {/* CREATE */}
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button>+ Tambah Menu</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Tambah Menu</DialogTitle>
              </DialogHeader>

              <form
                className="space-y-3"
                onSubmit={createForm.handleSubmit(createMenu)}
              >
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
                  <p className="text-xs text-red-500">{createForm.formState.errors.categoryId?.message}</p>
                </div>

                <div className="space-y-1">
                  <Label>Nama</Label>
                  <Input {...createForm.register("name")} />
                  <p className="text-xs text-red-500">{createForm.formState.errors.name?.message}</p>
                </div>

                <div className="space-y-1">
                  <Label>Harga</Label>
                  <Input 
                    type="number" 
                    {...createForm.register("price", { valueAsNumber: true })} 
                  />
                  <p className="text-xs text-red-500">{createForm.formState.errors.price?.message}</p>
                </div>

                <div className="space-y-1">
                  <Label>Deskripsi</Label>
                  <Textarea {...createForm.register("description")} />
                </div>

                <div className="space-y-1">
                  <Label>Image URL (opsional)</Label>
                  <Input {...createForm.register("imageUrl")} />
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    checked={createForm.watch("isAvailable")}
                    onCheckedChange={(v) => createForm.setValue("isAvailable", v)}
                  />
                  <span className="text-sm">Tersedia</span>
                </div>

                <DialogFooter>
                  <Button type="submit">Simpan</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="p-4 space-y-3">
        <Input placeholder="Cari menu..." value={q} onChange={(e) => setQ(e.target.value)} />

        {loading ? (
          <p className="text-sm opacity-70">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm opacity-70">Tidak ada menu.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((it) => (
              <div key={it.id} className="flex items-center justify-between gap-3 border-b pb-3">
                <div className="space-y-1">
                  <div className="font-medium">{it.name}</div>
                  <div className="text-xs opacity-70">
                    {it.categories?.name ?? "-"} • Rp {Number(it.price).toLocaleString("id-ID")}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={it.is_available ? "secondary" : "destructive"}>
                    {it.is_available ? "available" : "sold out"}
                  </Badge>

                  {it.is_available ? (
                    <Button variant="outline" onClick={() => void toggleAvailability(it.id, false)}>
                      Set Habis
                    </Button>
                  ) : (
                    <Button onClick={() => void toggleAvailability(it.id, true)}>Aktifkan</Button>
                  )}

                  <Button variant="outline" onClick={() => openEditDialog(it)}>
                    Edit
                  </Button>
                  <Button variant="destructive" onClick={() => void deleteMenu(it.id)}>
                    Hapus
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* EDIT DIALOG */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Menu</DialogTitle>
          </DialogHeader>

          <form className="space-y-3" onSubmit={editForm.handleSubmit(updateMenu)}>
            <div className="space-y-1">
              <Label>Kategori</Label>
              <Select
                value={editForm.watch("categoryId")}
                onValueChange={(val) => editForm.setValue("categoryId", val)}
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
              <p className="text-xs text-red-500">{editForm.formState.errors.categoryId?.message}</p>
            </div>

            <div className="space-y-1">
              <Label>Nama</Label>
              <Input {...editForm.register("name")} />
              <p className="text-xs text-red-500">{editForm.formState.errors.name?.message}</p>
            </div>

            <div className="space-y-1">
              <Label>Harga</Label>
              <Input 
                type="number" 
                {...editForm.register("price", { valueAsNumber: true })} 
              />
              <p className="text-xs text-red-500">{editForm.formState.errors.price?.message}</p>
            </div>

            <div className="space-y-1">
              <Label>Deskripsi</Label>
              <Textarea {...editForm.register("description")} />
            </div>

            <div className="space-y-1">
              <Label>Image URL (opsional)</Label>
              <Input {...editForm.register("imageUrl")} />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={editForm.watch("isAvailable")}
                onCheckedChange={(v) => editForm.setValue("isAvailable", v)}
              />
              <span className="text-sm">Tersedia</span>
            </div>

            <DialogFooter>
              <Button type="submit">Update</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}