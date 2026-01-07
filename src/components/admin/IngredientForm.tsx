"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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

  async function onSubmit() {
    setError("");

    if (!name.trim()) return setError("Nama wajib diisi.");
    if (!unit.trim()) return setError("Unit wajib diisi.");

    startTransition(async () => {
      try {
        if (mode === "create") {
          const res = await fetch("/api/admin/ingredients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: name.trim(),
              unit: unit.trim(),
              initial_stock: Number(initialStock) || 0,
              min_stock: Number(minStock) || 0,
              cost_per_unit: Number(cost) || 0,
              notes: notes.trim() || null,
            }),
          });

          const j = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(j?.message ?? "Gagal membuat ingredient");

          router.push("/admin/ingredients");
          router.refresh();
          return;
        }

        // edit
        const res = await fetch(`/api/admin/ingredients/${initial!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            unit: unit.trim(),
            min_stock: Number(minStock) || 0,
            cost_per_unit: Number(cost) || 0,
            notes: notes.trim() || null,
          }),
        });

        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j?.message ?? "Gagal update ingredient");

        router.push("/admin/ingredients");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      }
    });
  }

  return (
    <div className="space-y-4">
      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      <div className="space-y-2">
        <div className="text-sm font-semibold">Nama Bahan</div>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Kentang" />
      </div>

      <div className="space-y-2">
        <div className="text-sm font-semibold">Unit</div>
        <select
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          value={unit}
          aria-label="select"
          onChange={(e) => setUnit(e.target.value)}
        >
          <option value="gram">gram</option>
          <option value="pcs">pcs</option>
          <option value="ml">ml</option>
          <option value="lembar">lembar</option>
          <option value="sachet">sachet</option>
        </select>
      </div>

      {mode === "create" ? (
        <div className="space-y-2">
          <div className="text-sm font-semibold">Stok Awal</div>
          <Input
            type="number"
            value={initialStock}
            onChange={(e) => setInitialStock(Number(e.target.value))}
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <div className="text-sm font-semibold">Minimum Stock (Threshold)</div>
        <Input type="number" value={minStock} onChange={(e) => setMinStock(Number(e.target.value))} />
      </div>

      <div className="space-y-2">
        <div className="text-sm font-semibold">Cost per unit (opsional)</div>
        <Input type="number" value={cost} onChange={(e) => setCost(Number(e.target.value))} />
      </div>

      <div className="space-y-2">
        <div className="text-sm font-semibold">Catatan (opsional)</div>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <Button onClick={onSubmit} disabled={isPending} className="w-full">
        {isPending ? "Menyimpan..." : mode === "create" ? "Simpan" : "Update"}
      </Button>
    </div>
  );
}
