import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getAdminCookieName } from "@/lib/admin-auth";
import { Card } from "@/components/ui/card";
import IngredientForm from "@/components/admin/IngredientForm";
import type { GetIngredientResponse, Ingredient } from "@/types/inventory";

export const dynamic = "force-dynamic";

async function fetchIngredient(id: string): Promise<Ingredient | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(getAdminCookieName())?.value ?? "";

  // Pakai relative URL aman di Next server (tanpa NEXT_PUBLIC_APP_URL juga bisa).
  const res = await fetch(`http://localhost:3000/api/admin/ingredients/${id}`, {
    headers: { Cookie: `${getAdminCookieName()}=${token}` },
    cache: "no-store",
  });

  if (!res.ok) return null;

  const data: GetIngredientResponse = await res.json();
  return data.ingredient ?? null;
}

export default async function EditIngredientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const ingredient = await fetchIngredient(id);
  if (!ingredient) return notFound();

  return (
    <main className="p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Edit Bahan Baku</h1>

        <Card className="p-4">
          <IngredientForm mode="edit" initial={ingredient} />
        </Card>
      </div>
    </main>
  );
}
