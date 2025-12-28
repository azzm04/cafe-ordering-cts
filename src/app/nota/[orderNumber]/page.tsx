import Link from "next/link"
import { supabaseServer } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatRupiah } from "@/lib/utils"

type Params = { orderNumber: string }

type OrderWithTable = {
  id: string
  order_number: string
  total_amount: number
  payment_status: "pending" | "paid" | "failed" | "expired"
  payment_method: string | null
  created_at: string
  completed_at: string | null
  tables?: { table_number: number } | null
}

type OrderItemWithMenu = {
  id: string
  menu_item_id: string
  quantity: number
  price: number
  subtotal: number
  notes?: string | null
  menu_items?: { name: string } | null
}

export default async function NotaPage({ params }: { params: Promise<Params> }) {
  const { orderNumber } = await params

  const { data: order } = await supabaseServer
    .from("orders")
    .select(
      "id, order_number, total_amount, payment_status, payment_method, created_at, completed_at, tables(table_number)",
    )
    .eq("order_number", orderNumber)
    .single<OrderWithTable>()

  if (!order) {
    return (
      <main className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="p-6 max-w-md w-full space-y-4 text-center">
          <p className="text-muted-foreground">Order tidak ditemukan.</p>
          <Link href="/">
            <Button className="w-full font-semibold">Kembali</Button>
          </Link>
        </Card>
      </main>
    )
  }

  const { data: items } = await supabaseServer
    .from("order_items")
    .select("id, menu_item_id, quantity, price, subtotal, notes, menu_items(name)")
    .eq("order_id", order.id)
    .returns<OrderItemWithMenu[]>()

  const tableNumber = order.tables?.table_number

  const isCash = order.payment_method === "cash"
  const isCashPending = isCash && order.payment_status === "pending"

  return (
    <main className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-foreground">Nota Digital</h2>
        <p className="text-muted-foreground mt-1">Simpan untuk referensi.</p>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Pending Cash Alert */}
        {isCashPending ? (
          <Card className="p-4 bg-accent/10 border border-accent">
            <div className="font-semibold text-foreground">Menunggu pembayaran tunai</div>
            <div className="text-sm text-muted-foreground mt-1">
              Silakan bayar ke kasir dan tunjukkan nomor order:{" "}
              <span className="font-semibold text-foreground">{order.order_number}</span>
            </div>
          </Card>
        ) : null}

        {/* Order Details */}
        <Card className="p-6 space-y-4">
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Order Number</div>
            <div className="text-2xl font-bold text-foreground">{order.order_number}</div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Meja</span>
              <span className="font-semibold">{tableNumber ?? "-"}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Metode</span>
              <span className="font-semibold">{order.payment_method ?? "midtrans"}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Status</span>
              <span className="font-semibold text-primary">{order.payment_status}</span>
            </div>
          </div>

          <Separator />

          {/* Items List */}
          <div className="space-y-3">
            {(items ?? []).map((it) => (
              <div key={it.id} className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="font-semibold text-foreground">{it.menu_items?.name ?? it.menu_item_id}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {it.quantity} × {formatRupiah(it.price)}
                  </div>
                  {it.notes ? <div className="text-xs text-muted-foreground mt-1">Catatan: {it.notes}</div> : null}
                </div>
                <div className="text-sm font-semibold text-right">{formatRupiah(it.subtotal)}</div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Total */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-muted-foreground font-medium">Total</span>
            <span className="text-2xl font-bold text-primary">{formatRupiah(order.total_amount)}</span>
          </div>
        </Card>

        {/* Order Again Button */}
        <Link href="/menu" className="block">
          <Button className="w-full font-semibold h-11">Pesan Lagi</Button>
        </Link>
      </div>
    </main>
  )
}
