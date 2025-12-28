"use client"

import Link from "next/link"
import { useCartStore } from "@/store/cartStore"
import { CartItem } from "@/components/CartItem"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Card } from "@/components/ui/card"
import { formatRupiah } from "@/lib/utils"

export default function KeranjangPage() {
  const items = useCartStore((s) => s.items)
  const tableNumber = useCartStore((s) => s.tableNumber)
  const total = useCartStore((s) => s.getTotalAmount())

  if (!tableNumber) {
    return (
      <main className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="p-6 space-y-4 max-w-md w-full text-center">
          <p className="text-muted-foreground">Kamu belum memilih meja.</p>
          <Link href="/pilih-meja">
            <Button className="w-full font-semibold">Pilih Meja</Button>
          </Link>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-foreground">Keranjang</h2>
        <p className="text-muted-foreground mt-1">Meja {tableNumber}</p>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto">
        {items.length === 0 ? (
          <Card className="p-8 space-y-4 text-center">
            <p className="text-muted-foreground">Keranjang kosong.</p>
            <Link href="/menu">
              <Button variant="outline" className="w-full font-semibold bg-transparent">
                Balik ke Menu
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Items */}
            <div className="space-y-3">
              {items.map((it) => (
                <CartItem key={it.id} item={it} />
              ))}
            </div>

            <Separator className="my-2" />

            {/* Total */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-muted-foreground font-medium">Total</div>
                <div className="text-2xl font-bold text-primary">{formatRupiah(total)}</div>
              </div>

              <Link href="/pembayaran" className="block">
                <Button className="w-full font-semibold h-11">Lanjut Pembayaran</Button>
              </Link>
            </Card>
          </div>
        )}
      </div>
    </main>
  )
}
