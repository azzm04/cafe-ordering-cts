import { formatRupiah } from "@/lib/utils";
import type { OrderItemWithMenu } from "@/lib/nota/type";

export default function NotaItemsList({ items }: { items: OrderItemWithMenu[] }) {
  if (items.length === 0) {
    return <div className="text-center py-4 text-sm text-muted-foreground">Tidak ada item.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
        Rincian Pesanan
      </div>
      <div className="space-y-3">
        {items.map((it) => (
          <div key={it.id} className="flex justify-between items-start text-sm">
            <div className="flex-1 pr-4">
              <div className="font-semibold text-foreground">
                {it.menu_items?.name ?? "Menu Item"}
              </div>
              <div className="text-muted-foreground text-xs mt-0.5">
                {it.quantity} x {formatRupiah(it.price)}
              </div>
              {it.notes && (
                <div className="mt-1 text-[10px] text-muted-foreground bg-muted/50 px-2 py-1 rounded inline-block">
                  {it.notes}
                </div>
              )}
            </div>
            <div className="font-bold text-foreground tabular-nums">
              {formatRupiah(it.subtotal)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}