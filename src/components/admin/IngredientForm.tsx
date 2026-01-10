"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label"; // Gunakan Label dari shadcn jika ada, atau label biasa
import { ArrowLeft, Save, Loader2 } from "lucide-react";

type Ingredient = {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  cost_per_unit: number | null;
  notes: string | null;
};

export default function IngredientForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: Ingredient;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(initial?.name ?? "");
  const [unit, setUnit] = useState(initial?.unit ?? "gram");
  const [initialStock, setInitialStock] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(initial?.min_stock ?? 0);
  const [cost, setCost] = useState<number>(initial?.cost_per_unit ?? 0);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState<string>("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); // Mencegah reload form native
    setError("");

    if (!name.trim()) return setError("Nama bahan wajib diisi.");
    if (!unit.trim()) return setError("Satuan unit wajib dipilih.");

    startTransition(async () => {
      try {
        const payload = {
            name: name.trim(),
            unit: unit.trim(),
            min_stock: Number(minStock) || 0,
            cost_per_unit: Number(cost) || 0,
            notes: notes.trim() || null,
        };

        let res;
        
        if (mode === "create") {
            res = await fetch("/api/admin/ingredients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...payload,
                initial_stock: Number(initialStock) || 0,
            }),
            });
        } else {
            res = await fetch(`/api/admin/ingredients/${initial!.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            });
        }

        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j?.message ?? "Terjadi kesalahan saat menyimpan");

        router.push("/admin/ingredients");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      
      {/* Header Form */}
      <div className="flex items-center justify-between">
        <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Batal & Kembali
        </button>
      </div>

      {error && (
        <div className="bg-destructive/15 p-3 rounded-md border border-destructive/20 text-destructive text-sm font-medium">
          {error}
        </div>
      )}

      {/* Main Form Layout using Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Kolom Kiri: Informasi Dasar */}
        <div className="space-y-4">
            <h3 className="text-lg font-semibold tracking-tight">Informasi Dasar</h3>
            <div className="grid gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nama Bahan</Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Contoh: Daging Sapi Premium"
                        className="h-10"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="unit">Satuan Unit</Label>
                    <div className="relative">
                        <select
                            aria-label="select"
                            id="unit"
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={unit}
                            onChange={(e) => setUnit(e.target.value)}
                        >
                            <option value="gram">gram (gr)</option>
                            <option value="kg">kilogram (kg)</option>
                            <option value="pcs">pieces (pcs)</option>
                            <option value="ml">mililiter (ml)</option>
                            <option value="liter">liter (l)</option>
                            <option value="lembar">lembar</option>
                            <option value="sachet">sachet</option>
                            <option value="porsi">porsi</option>
                        </select>
                    </div>
                    <p className="text-[0.8rem] text-muted-foreground">
                        Satuan yang digunakan untuk menghitung stok.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="notes">Catatan (Opsional)</Label>
                    <Textarea 
                        id="notes"
                        value={notes} 
                        onChange={(e) => setNotes(e.target.value)} 
                        className="min-h-25 resize-none"
                        placeholder="Info supplier, penyimpanan, dll..."
                    />
                </div>
            </div>
        </div>

        {/* Kolom Kanan: Manajemen Stok */}
        <div className="space-y-4">
            <h3 className="text-lg font-semibold tracking-tight">Manajemen Stok</h3>
            <div className="grid gap-4 bg-muted/30 p-4 rounded-lg border">
                
                {mode === "create" && (
                    <div className="space-y-2">
                        <Label htmlFor="initialStock">Stok Awal</Label>
                        <Input
                            id="initialStock"
                            type="number"
                            min="0"
                            value={initialStock}
                            onChange={(e) => setInitialStock(Number(e.target.value))}
                            className="bg-background"
                        />
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="minStock">Minimum Alert</Label>
                        <Input
                            id="minStock"
                            type="number"
                            min="0"
                            value={minStock}
                            onChange={(e) => setMinStock(Number(e.target.value))}
                            className="bg-background"
                        />
                        <p className="text-[0.8rem] text-muted-foreground">
                            Batas notifikasi stok menipis.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="cost">Cost per Unit (Rp)</Label>
                        <Input
                            id="cost"
                            type="number"
                            min="0"
                            value={cost}
                            onChange={(e) => setCost(Number(e.target.value))}
                            className="bg-background"
                            placeholder="0"
                        />
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-4 pt-4 border-t">
        <Button
            type="submit"
            disabled={isPending}
            className="min-w-30"
        >
            {isPending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                </>
            ) : (
                <>
                    <Save className="mr-2 h-4 w-4" />
                    {mode === "create" ? "Simpan Data" : "Update Data"}
                </>
            )}
        </Button>
      </div>
    </form>
  );
}