"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cartStore";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

export default function KeranjangPage() {
  const router = useRouter();

  const tableNumber = useCartStore((s) => s.tableNumber);
  const items = useCartStore((s) => s.items);

  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const updateNotes = useCartStore((s) => s.updateNotes);
  const getTotalAmount = useCartStore((s) => s.getTotalAmount);

  const total = useMemo(() => getTotalAmount(), [getTotalAmount, items]);

  return (
    <main className="mx-auto min-h-screen max-w-md p-6 space-y-4">
      {/* Header + Back */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Keranjang</h1>
          <p className="text-sm opacity-80">Meja {tableNumber ?? "-"}</p>
        </div>

        <Button
          variant="secondary"
          onClick={() => {
            // fallback yang aman
            if (window.history.length > 1) router.back();
            else router.push("/menu");
          }}
        >
          Kembali
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border p-4">
          <p className="text-sm opacity-80">Keranjang kosong.</p>
          <div className="mt-3">
            <Button onClick={() => router.push("/menu")}>Ke Menu</Button>
          </div>
        </div>
      ) : (
        <>
          {items.map((it) => (
            <div key={it.id} className="rounded-xl border p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-semibold">{it.name}</p>
                  <p className="text-sm opacity-80">
                    {formatRupiah(it.price)} × {it.quantity} ={" "}
                    {formatRupiah(it.price * it.quantity)}
                  </p>
                </div>

                <Button variant="destructive" onClick={() => removeItem(it.id)}>
                  Hapus
                </Button>
              </div>

              {/* Qty */}
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  onClick={() => updateQuantity(it.id, it.quantity - 1)}
                  disabled={it.quantity <= 1}
                >
                  -
                </Button>

                <div className="w-8 text-center font-medium">{it.quantity}</div>

                <Button
                  variant="secondary"
                  onClick={async () => {
                    // prepare current cart items
                    const items = useCartStore.getState().items.map((x) => ({ menu_item_id: x.id, quantity: x.quantity }));
                    const idx = items.findIndex((x) => x.menu_item_id === it.id);
                    if (idx >= 0) items[idx].quantity = items[idx].quantity + 1;

                    try {
                      const res = await fetch('/api/cart/availability', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ items }),
                      });
                      const json = await res.json();
                      if (!res.ok || !json?.ok) {
                        if (json?.shortages && json.shortages.length > 0) {
                          const s = json.shortages[0];
                          toast.error(`Stok tidak cukup untuk bahan ${s.ingredient_id}. Tersedia: ${s.available}, dibutuhkan: ${s.needed}`);
                        } else {
                          toast.error('Stok tidak cukup');
                        }
                        return;
                      }

                      updateQuantity(it.id, it.quantity + 1);
                    } catch (err) {
                      console.error('availability check failed', err);
                      toast.error('Gagal cek stok');
                    }
                  }}
                  disabled={typeof it.max_portions === "number" && it.quantity >= it.max_portions}
                >
                  +
                </Button>
                {typeof it.max_portions === "number" && it.quantity >= it.max_portions ? (
                  <div className="text-sm text-muted-foreground">Maksimal {it.max_portions} porsi</div>
                ) : null
                }
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <p className="text-sm opacity-80">Catatan (opsional)</p>
                <textarea
                  className="w-full rounded-lg border p-3 text-sm outline-none"
                  placeholder="Contoh: pedas ya / tanpa es"
                  value={it.notes ?? ""}
                  onChange={(e) => updateNotes(it.id, e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          ))}

          {/* Total */}
          <div className="rounded-xl border p-4 flex items-center justify-between">
            <p className="font-medium">Total</p>
            <p className="text-xl font-bold">{formatRupiah(total)}</p>
          </div>

          <Button className="w-full" onClick={() => router.push("/pembayaran")}>
            Lanjut Pembayaran
          </Button>
        </>
      )}
    </main>
  );
}
