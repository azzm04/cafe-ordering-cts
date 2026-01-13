"use client";

import { toast } from "sonner";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

import type { Category, MenuItemRow } from "@/types/admin/menu";
import { apiUpdateMenu } from "@/services/admin/menu";

const schema = z.object({
  id: z.string().min(1),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  name: z.string().min(1, "Nama menu wajib diisi"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Harga tidak boleh minus").refine((val) => !isNaN(val), "Harga harus berupa angka"),
  hpp: z.coerce.number().min(0, "HPP tidak boleh minus").refine((val) => !isNaN(val), "HPP harus berupa angka"),
  imageUrl: z.string().optional(),
  isAvailable: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export default function MenuDialogs({
  categories,
  openEdit,
  setOpenEdit,
  editTarget,
  onUpdated,
  deleteId,
  setDeleteId,
  onConfirmDelete,
}: {
  categories: Category[];
  openEdit: boolean;
  setOpenEdit: (v: boolean) => void;
  editTarget: MenuItemRow | null;
  onUpdated: () => Promise<void>;
  deleteId: string | null;
  setDeleteId: (v: string | null) => void;
  onConfirmDelete: () => void;
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

  const currentCategoryId = useWatch({ control: form.control, name: "categoryId" });
  const currentIsAvailable = useWatch({ control: form.control, name: "isAvailable" });

  useEffect(() => {
    if (!editTarget) return;
    form.reset({
      id: editTarget.id,
      categoryId: editTarget.category_id,
      name: editTarget.name,
      description: editTarget.description ?? "",
      price: Number(editTarget.price) || 0,
      hpp: Number((editTarget.hpp) || 0),
      imageUrl: editTarget.image_url ?? "",
      isAvailable: editTarget.is_available,
    });
  }, [editTarget, form]);

  const submit = async (values: FormValues) => {
    try {
      await apiUpdateMenu({
        id: values.id,
        categoryId: values.categoryId,
        name: values.name,
        description: values.description ?? "",
        price: values.price,
        hpp: values.hpp, 
        imageUrl: values.imageUrl ?? "",
        isAvailable: values.isAvailable,
      });
      toast.success("Menu berhasil diupdate");
      await onUpdated();
      setOpenEdit(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  };

  return (
    <>
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="max-w-lg w-[95vw]">
          <DialogHeader>
            <DialogTitle>Edit Menu</DialogTitle>
          </DialogHeader>

          <form className="space-y-3" onSubmit={form.handleSubmit(submit)}>
            <div className="space-y-1">
              <Label>Kategori</Label>
              <Select value={currentCategoryId} onValueChange={(v) => form.setValue("categoryId", v)}>
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
                <p className="text-[0.8rem] text-destructive font-medium">{form.formState.errors.categoryId.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Nama Menu</Label>
              <Input {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-[0.8rem] text-destructive font-medium">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Harga (Rp)</Label>
                <Input type="number" {...form.register("price")} />
                {form.formState.errors.price && (
                  <p className="text-[0.8rem] text-destructive font-medium">{form.formState.errors.price.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label>HPP / Modal (Rp)</Label>
                <Input 
                  type="number" 
                  {...form.register("hpp")} 
                  className="bg-muted/30"
                  placeholder="0"
                />
                {form.formState.errors.hpp && (
                  <p className="text-[0.8rem] text-destructive font-medium">{form.formState.errors.hpp.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label>Deskripsi</Label>
              <Textarea {...form.register("description")} rows={3} />
            </div>

            <div className="space-y-1">
              <Label>Image URL</Label>
              <Input {...form.register("imageUrl")} />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Switch checked={currentIsAvailable} onCheckedChange={(v) => form.setValue("isAvailable", v)} />
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
            <AlertDialogAction onClick={onConfirmDelete} className="bg-destructive hover:bg-destructive/90">
              Arsip Sekarang
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}