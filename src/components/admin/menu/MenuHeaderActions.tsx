"use client";

import Link from "next/link";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { Category } from "@/types/admin/menu";
import { apiCreateMenu } from "@/services/admin/menu";

const schema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().min(0),
  imageUrl: z.string().optional(),
  isAvailable: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export default function MenuHeaderActions({
  loading,
  onRefresh,
  openCreate,
  setOpenCreate,
  categories,
  onCreated,
}: {
  loading: boolean;
  onRefresh: () => void;
  openCreate: boolean;
  setOpenCreate: (v: boolean) => void;
  categories: Category[];
  onCreated: () => Promise<void>;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      categoryId: "",
      name: "",
      description: "",
      price: 0,
      imageUrl: "",
      isAvailable: true,
    },
  });

  const submit = async (values: FormValues) => {
    try {
      await apiCreateMenu({
        categoryId: values.categoryId,
        name: values.name,
        description: values.description ?? "",
        price: values.price,
        imageUrl: values.imageUrl ?? "",
        isAvailable: values.isAvailable,
      });
      toast.success("Menu berhasil dibuat");
      form.reset();
      await onCreated();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  };

  return (
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

        <Button variant="secondary" onClick={onRefresh} disabled={loading} className="flex-1 sm:flex-none">
          {loading ? "Loading..." : "Refresh"}
        </Button>

        <Link href="/admin/archived-menu">
          <Button variant="outline">Lihat Arsip</Button>
        </Link>

        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogTrigger asChild>
            <Button className="flex-1 sm:flex-none">Tambah Menu</Button>
          </DialogTrigger>

          <DialogContent className="max-w-lg w-[95vw]">
            <DialogHeader>
              <DialogTitle>Tambah Menu Baru</DialogTitle>
            </DialogHeader>

            <form className="space-y-3" onSubmit={form.handleSubmit(submit)}>
              <div className="space-y-1">
                <Label>Kategori</Label>
                <Select value={form.watch("categoryId")} onValueChange={(v) => form.setValue("categoryId", v)}>
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
              </div>

              <div className="space-y-1">
                <Label>Nama Menu</Label>
                <Input {...form.register("name")} placeholder="Contoh: Nasi Menchi Saus BBQ" />
              </div>

              <div className="space-y-1">
                <Label>Harga (Rp)</Label>
                <Input type="number" {...form.register("price", { valueAsNumber: true })} />
              </div>

              <div className="space-y-1">
                <Label>Deskripsi</Label>
                <Textarea {...form.register("description")} rows={3} />
              </div>

              <div className="space-y-1">
                <Label>Image URL</Label>
                <Input {...form.register("imageUrl")} placeholder="https://..." />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Switch checked={form.watch("isAvailable")} onCheckedChange={(v) => form.setValue("isAvailable", v)} />
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
  );
}
