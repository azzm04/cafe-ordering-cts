"use client";

import Image from "next/image";
import { memo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { MenuItemRow } from "@/components/menu/constants";
import { formatRupiah } from "@/components/menu/constants";

function MenuItemCardBase({
  item,
  onAdd,
}: {
  item: MenuItemRow;
  onAdd: () => void;
}) {
  return (
    <div className="p-4 sm:p-5">
      <div className="flex gap-3 sm:gap-4">
        <div className="shrink-0 relative w-20 h-20 sm:w-24 sm:h-24">
          {item.image_url ? (
            <Image
              src={item.image_url}
              alt={item.name}
              fill
              className="rounded-lg object-cover"
              sizes="(max-width: 640px) 80px, 96px"
            />
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-muted flex items-center justify-center text-3xl sm:text-4xl">
              🍽️
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div className="space-y-1">
            <h4 className="font-semibold text-sm sm:text-base line-clamp-2">{item.name}</h4>
            {item.description ? (
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{item.description}</p>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            <span className="font-bold text-sm sm:text-base text-primary">{formatRupiah(item.price)}</span>

            <Button
              size="sm"
              onClick={() => {
                onAdd();
                toast.success(`${item.name} ditambahkan`);
              }}
              className="bg-primary hover:bg-primary/90 font-semibold text-xs sm:text-sm"
            >
              Tambah
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const MenuItemCard = memo(MenuItemCardBase);
export default MenuItemCard;
