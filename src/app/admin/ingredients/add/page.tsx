import { Card } from "@/components/ui/card";
import IngredientForm from "@/components/admin/IngredientForm";

export const dynamic = "force-dynamic";

export default function AddIngredientPage() {
  return (
    <main className="p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Tambah Bahan Baku</h1>
        <Card className="p-4">
          <IngredientForm mode="create" />
        </Card>
      </div>
    </main>
  );
}
