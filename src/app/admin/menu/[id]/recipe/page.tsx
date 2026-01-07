import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireOwner } from "@/lib/admin-auth-server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RecipeManager } from "@/components/admin/RecipeManager";
import type {
  IngredientRow,
  MenuItemRow,
  MenuRecipeRow,
} from "@/types/inventory";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Params = { id: string };

export default async function MenuRecipePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const guard = await requireOwner();
  if (guard instanceof NextResponse) redirect("/admin"); // atau tampilkan forbidden page

  const { id: menuItemId } = await params;

  const { data: menu, error: menuErr } = await supabaseAdmin
    .from("menu_items")
    .select("id, name, price, is_available, is_archived")
    .eq("id", menuItemId)
    .single<MenuItemRow>();

  if (menuErr || !menu) return notFound();

  const { data: ingredients, error: ingErr } = await supabaseAdmin
    .from("ingredients")
    .select("id, name, unit, current_stock, min_stock")
    .order("name", { ascending: true })
    .returns<IngredientRow[]>();

  if (ingErr) return notFound();

  const { data: recipes, error: recErr } = await supabaseAdmin
    .from("menu_recipes")
    .select(
      `
      id,
      menu_item_id,
      ingredient_id,
      quantity_needed,
      ingredients:ingredient_id (
        id,
        name,
        unit,
        current_stock,
        min_stock
      )
    `
    )
    .eq("menu_item_id", menuItemId)
    .order("created_at", { ascending: true });

  if (recErr) return notFound();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Atur Resep</h1>
          <p className="text-muted-foreground">
            Menu:{" "}
            <span className="font-semibold text-foreground">{menu.name}</span>
          </p>
        </div>

        <Link href="/admin/menu">
          <Button variant="outline">← Kembali</Button>
        </Link>
      </div>

      <Card className="p-5">
        <RecipeManager
          menuItemId={menuItemId}
          menuName={menu.name}
          initialIngredients={ingredients ?? []}
          initialRecipes={(recipes ?? []) as unknown as MenuRecipeRow[]}
        />
      </Card>
    </div>
  );
}
