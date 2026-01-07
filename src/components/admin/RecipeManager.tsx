"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { IngredientRow, MenuRecipeRow } from "@/types/inventory";

type Props = {
  menuItemId: string;
  menuName: string;
  initialIngredients: IngredientRow[];
  initialRecipes: MenuRecipeRow[];
};

function toNumber(x: string): number | null {
  const v = x.trim();
  if (!v) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return n;
}

export function RecipeManager({
  menuItemId,
  menuName,
  initialIngredients,
  initialRecipes,
}: Props) {
  const [recipes, setRecipes] = useState<MenuRecipeRow[]>(initialRecipes);
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>(
    initialIngredients[0]?.id ?? ""
  );
  const [qty, setQty] = useState<string>("");

  const [error, setError] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const ingredientById = useMemo(() => {
    const m = new Map<string, IngredientRow>();
    for (const ing of initialIngredients) m.set(ing.id, ing);
    return m;
  }, [initialIngredients]);

  const maxPortions = useMemo(() => {
    if (recipes.length === 0) return null;

    let min = Number.POSITIVE_INFINITY;

    for (const r of recipes) {
      const ing = r.ingredients ?? ingredientById.get(r.ingredient_id) ?? null;
      if (!ing) continue;
      if (r.quantity_needed <= 0) continue;

      const portions = Math.floor(Number(ing.current_stock) / Number(r.quantity_needed));
      if (portions < min) min = portions;
    }

    if (!Number.isFinite(min)) return null;
    return min;
  }, [recipes, ingredientById]);

  async function reloadRecipes() {
    const res = await fetch(`/api/admin/menu-recipes?menuItemId=${menuItemId}`, {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) {
      const j = (await res.json()) as { message?: string };
      throw new Error(j.message ?? "Failed load recipes");
    }

    const j = (await res.json()) as { recipes: MenuRecipeRow[] };
    setRecipes(j.recipes);
  }

  async function upsertRecipe() {
    setError("");

    const q = toNumber(qty);
    if (!selectedIngredientId) return setError("Pilih bahan dulu.");
    if (q === null) return setError("Qty per porsi wajib angka.");
    if (q <= 0) return setError("Qty per porsi harus > 0.");

    const res = await fetch("/api/admin/menu-recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        menuItemId,
        ingredientId: selectedIngredientId,
        quantityNeeded: q,
      }),
    });

    if (!res.ok) {
      const j = (await res.json()) as { message?: string };
      setError(j.message ?? "Gagal simpan resep");
      return;
    }

    await reloadRecipes();
    setQty("");
  }

  async function removeRecipe(ingredientId: string) {
    setError("");

    const res = await fetch("/api/admin/menu-recipes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ menuItemId, ingredientId }),
    });

    if (!res.ok) {
      const j = (await res.json()) as { message?: string };
      setError(j.message ?? "Gagal hapus ingredient");
      return;
    }

    await reloadRecipes();
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="text-lg font-bold">Resep: {menuName}</div>
        <div className="text-sm text-muted-foreground">
          Set bahan baku yang dibutuhkan per porsi.
        </div>
      </div>

      <div className="rounded-lg border p-4 bg-muted/30">
        <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
          Perkiraan maksimal porsi bisa dibuat (berdasarkan stok saat ini)
        </div>
        <div className="text-2xl font-bold mt-1">
          {maxPortions === null ? "-" : `${maxPortions} porsi`}
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
        <div className="sm:col-span-6">
          <label className="text-sm font-semibold">Bahan</label>
          <select
            className="mt-2 w-full border rounded-md h-10 px-3 bg-background"
            value={selectedIngredientId}
            aria-label="select"
            onChange={(e) => setSelectedIngredientId(e.target.value)}
          >
            {initialIngredients.map((ing) => (
              <option key={ing.id} value={ing.id}>
                {ing.name} ({ing.current_stock} {ing.unit})
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-3">
          <label className="text-sm font-semibold">Qty / porsi</label>
          <input
            className="mt-2 w-full border rounded-md h-10 px-3 bg-background"
            placeholder="contoh: 120"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            inputMode="decimal"
          />
        </div>

        <div className="sm:col-span-3">
          <Button
            className="w-full"
            disabled={isPending}
            onClick={() => startTransition(async () => upsertRecipe())}
          >
            {isPending ? "Menyimpan..." : "Tambah / Update"}
          </Button>
        </div>

        {error ? <div className="sm:col-span-12 text-sm text-red-600">{error}</div> : null}
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Daftar Resep
        </div>

        {recipes.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Belum ada ingredient untuk menu ini.
          </div>
        ) : (
          <div className="space-y-2">
            {recipes.map((r) => {
              const ing = r.ingredients ?? ingredientById.get(r.ingredient_id) ?? null;

              return (
                <div
                  key={r.ingredient_id}
                  className="flex items-center justify-between gap-3 border rounded-lg p-3"
                >
                  <div className="min-w-0">
                    <div className="font-semibold truncate">
                      {ing?.name ?? r.ingredient_id}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {r.quantity_needed} {ing?.unit ?? ""} / porsi • stok:{" "}
                      {ing ? `${ing.current_stock} ${ing.unit}` : "-"}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    disabled={isPending}
                    onClick={() => startTransition(async () => removeRecipe(r.ingredient_id))}
                  >
                    Hapus
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
