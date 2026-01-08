"use client";

import Image from "next/image";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import type { MenuItemRow } from "@/components/menu/constants";
import { formatRupiah } from "@/components/menu/constants";
import { useCartStore } from "@/store/cartStore";
import { Plus, Utensils } from "lucide-react";

function MenuItemCardBase({
  item,
  onAdd,
}: {
  item: MenuItemRow;
  onAdd: () => void;
}) {
  const quantity = useCartStore((s) => 
    s.items.find((x) => x.id === item.id)?.quantity ?? 0
  );

  const reachedMax = typeof item.max_portions === "number" && quantity >= item.max_portions;
  const isOutOfStock = item.max_portions === 0;

  return (
    <div className="group relative flex gap-4 rounded-xl border border-border/50 bg-card p-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md sm:p-4">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-28 sm:w-28">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className={`object-cover transition-transform duration-500 will-change-transform group-hover:scale-105 ${
              isOutOfStock ? "grayscale opacity-70" : ""
            }`}
            sizes="(max-width: 640px) 96px, 112px"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary/30 text-muted-foreground">
            <Utensils className="h-8 w-8 opacity-40" />
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
            <span className="rounded-full bg-destructive/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
              Habis
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 min-w-0 flex-col justify-between py-0.5">
        <div className="space-y-1">
          <div className="flex justify-between items-start">
            <h4 className="line-clamp-2 text-sm font-semibold leading-tight text-foreground transition-colors group-hover:text-primary sm:text-base">
              {item.name}
            </h4>
          </div>
          
          {item.description && (
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {item.description}
            </p>
          )}

          {!isOutOfStock && item.max_portions !== null && item.max_portions !== undefined && (
            <div className={`mt-1 inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${
              item.max_portions < 5
                ? "bg-amber-50 text-amber-700 ring-amber-600/20"
                : "bg-green-50 text-green-700 ring-green-600/20"
            }`}>
              {item.max_portions < 5 ? "Sisa sedikit: " : "Tersedia: "} 
              {item.max_portions}
            </div>
          )}
        </div>

        <div className="mt-3 flex items-end justify-between gap-2 border-t border-border/40 pt-2">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase text-muted-foreground/70">
              Harga
            </span>
            <span className="text-sm font-bold text-primary sm:text-lg">
              {formatRupiah(item.price)}
            </span>
          </div>

          <Button
            size="sm"
            onClick={onAdd}
            disabled={isOutOfStock || reachedMax}
            className={`group/btn relative h-8 overflow-hidden rounded-full px-4 text-xs font-semibold shadow-sm transition-transform active:scale-95 ${
               isOutOfStock || reachedMax 
                ? "opacity-50 cursor-not-allowed" 
                : "hover:bg-primary/90 hover:shadow-primary/20 hover:shadow-lg"
            }`}
          >
            {!isOutOfStock && !reachedMax && (
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover/btn:translate-x-full" />
            )}
            
            <div className="relative flex items-center gap-1.5">
              <Plus 
                className="h-3.5 w-3.5 stroke-[3] transition-transform duration-500 ease-out group-hover/btn:rotate-180" 
              />
              
              <span className="hidden sm:inline">Tambah</span>
              <span className="sm:hidden">Tambah</span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}

const MenuItemCard = memo(MenuItemCardBase);
export default MenuItemCard;