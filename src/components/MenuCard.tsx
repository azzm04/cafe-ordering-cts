"use client";

import type { MenuItem } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cartStore";
import { formatRupiah } from "@/lib/utils";

export function MenuCard({ item }: { item: MenuItem }) {
  const addItem = useCartStore((s) => s.addItem);

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="font-semibold">{item.name}</div>
          {item.description && <div className="text-sm opacity-80">{item.description}</div>}
          <div className="text-sm font-semibold">{formatRupiah(item.price)}</div>
        </div>

        <Button
          onClick={() =>
            addItem({
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: 1,
              image_url: item.image_url,
            })
          }
        >
          Tambah
        </Button>
      </div>
    </Card>
  );
}
