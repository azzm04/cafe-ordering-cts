"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { CartItem } from "@/components/CartItem";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatRupiah } from "@/lib/utils";

export default function KeranjangPage() {
  const items = useCartStore((s) => s.items);
  const tableNumber = useCartStore((s) => s.tableNumber);
  const total = useCartStore((s) => s.getTotalAmount());

  if (!tableNumber) {
    return (
      <main className="mx-auto min-h-screen max-w-md p-6 space-y-3">
        <p className="text-sm">Kamu belum memilih meja.</p>
        <Link href="/pilih-meja">
          <Button>Pilih Meja</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-md p-6 space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Keranjang</h2>
        <p className="text-sm opacity-80">Meja {tableNumber}</p>
      </div>

      {items.length === 0 ? (
        <div className="space-y-3">
          <p className="text-sm opacity-80">Keranjang kosong.</p>
          <Link href="/menu">
            <Button>Balik ke Menu</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((it) => (
              <CartItem key={it.id} item={it} />
            ))}
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="text-sm opacity-80">Total</div>
            <div className="text-lg font-bold">{formatRupiah(total)}</div>
          </div>

          <Link href="/pembayaran">
            <Button className="w-full">Lanjut Pembayaran</Button>
          </Link>
        </>
      )}
    </main>
  );
}
