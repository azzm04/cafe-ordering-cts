"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type Ingredient = {
  id: string
  name: string
  unit: string
  current_stock: number
  min_stock: number
  cost_per_unit: number | null
  notes: string | null
}

export default function IngredientForm({
  mode,
  initial,
}: {
  mode: "create" | "edit"
  initial?: Ingredient
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState(initial?.name ?? "")
  const [unit, setUnit] = useState(initial?.unit ?? "gram")
  const [initialStock, setInitialStock] = useState<number>(0)
  const [minStock, setMinStock] = useState<number>(initial?.min_stock ?? 0)
  const [cost, setCost] = useState<number>(initial?.cost_per_unit ?? 0)
  const [notes, setNotes] = useState(initial?.notes ?? "")
  const [error, setError] = useState<string>("")

  async function onSubmit() {
    setError("")

    if (!name.trim()) return setError("Nama wajib diisi.")
    if (!unit.trim()) return setError("Unit wajib diisi.")

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
          })

          const j = await res.json().catch(() => ({}))
          if (!res.ok) throw new Error(j?.message ?? "Gagal membuat ingredient")

          router.push("/admin/ingredients")
          router.refresh()
          return
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
        })

        const j = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(j?.message ?? "Gagal update ingredient")

        router.push("/admin/ingredients")
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error")
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error ? (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">Nama Bahan</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Contoh: Kentang"
          className="h-11 px-4 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">Unit</label>
        <select
          className="h-11 w-full rounded-md border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
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
          <label className="text-sm font-semibold text-foreground">Stok Awal</label>
          <Input
            type="number"
            value={initialStock}
            onChange={(e) => setInitialStock(Number(e.target.value))}
            className="h-11 px-4 text-sm"
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">Minimum Stock (Threshold)</label>
        <Input
          type="number"
          value={minStock}
          onChange={(e) => setMinStock(Number(e.target.value))}
          className="h-11 px-4 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">Cost per unit (Opsional)</label>
        <Input
          type="number"
          value={cost}
          onChange={(e) => setCost(Number(e.target.value))}
          className="h-11 px-4 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">Catatan (Opsional)</label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="px-4 py-2 text-sm min-h-24" />
      </div>

      {/* Submit Button */}
      <Button
        onClick={onSubmit}
        disabled={isPending}
        className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-md transition-all"
      >
        {isPending ? "Menyimpan..." : mode === "create" ? "Simpan" : "Update"}
      </Button>
    </div>
  )
}
