"use client";

import Link from "next/link";
import { toast } from "sonner";
import { useForm, useWatch } from "react-hook-form";
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
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  name: z.string().min(1, "Nama menu wajib diisi"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Harga tidak boleh minus").refine((val) => !isNaN(val), "Harga harus berupa angka"),
  hpp: z.coerce.number().min(0, "HPP tidak boleh minus").refine((val) => !isNaN(val), "HPP harus berupa angka"),
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
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      categoryId: "",
      name: "",
      description: "",
      price: 0,
      hpp: 0,
      imageUrl: "",
      isAvailable: true,
    },
  } as const);

  const categoryId = useWatch({ control: form.control, name: "categoryId" });
  const isAvailable = useWatch({ control: form.control, name: "isAvailable" });

  const submit = async (values: FormValues) => {
    try {
      await apiCreateMenu({
        categoryId: values.categoryId,
        name: values.name,
        description: values.description ?? "",
        price: values.price,
        hpp: values.hpp,
        imageUrl: values.imageUrl ?? "",
        isAvailable: values.isAvailable,
      });
      toast.success("Menu berhasil dibuat");
      form.reset();
      await onCreated();
      setOpenCreate(false); 
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
        
        <Link href="/admin/ingredients" className="flex-1 sm:flex-none">
          <Button variant="outline" className="w-full sm:w-auto bg-transparent">
            Ingredients
          </Button>
        </Link>
        
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
                <Select value={categoryId} onValueChange={(v) => form.setValue("categoryId", v)}>
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
                {form.formState.errors.categoryId && (
                  <p className="text-[0.8rem] text-destructive font-medium">
                    {form.formState.errors.categoryId.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label>Nama Menu</Label>
                <Input {...form.register("name")} placeholder="Contoh: Nasi Menchi Saus BBQ" />
                {/* --- MENAMPILKAN ERROR NAMA --- */}
                {form.formState.errors.name && (
                  <p className="text-[0.8rem] text-destructive font-medium">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Harga Jual (Rp)</Label>
                  <Input type="number" {...form.register("price", { valueAsNumber: true })} />
                  {form.formState.errors.price && (
                    <p className="text-[0.8rem] text-destructive font-medium">
                      {form.formState.errors.price.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label>HPP / Modal (Rp)</Label>
                  <Input 
                    type="number" 
                    {...form.register("hpp", { valueAsNumber: true })} 
                    className="bg-muted/30"
                    placeholder="0"
                  />
                  {form.formState.errors.hpp && (
                    <p className="text-[0.8rem] text-destructive font-medium">
                      {form.formState.errors.hpp.message}
                    </p>
                  )}
                </div>
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
                <Switch checked={isAvailable} onCheckedChange={(v) => form.setValue("isAvailable", v)} />
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