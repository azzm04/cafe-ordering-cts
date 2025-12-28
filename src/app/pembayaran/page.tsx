"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useCartStore } from "@/store/cartStore"
import { useMidtransSnap } from "@/hooks/useMidtransSnap"
import { useOrder } from "@/hooks/useOrder"

declare global {
  interface Window {
    snap: {
      pay: (
        token: string,
        callbacks: {
          onSuccess?: () => void
          onPending?: () => void
          onError?: () => void
          onClose?: () => void
        },
      ) => void
    }
  }
}

type PaymentMethod = "midtrans" | "cash"

function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message
  if (typeof err === "string") return err
  try {
    return JSON.stringify(err)
  } catch {
    return "Unknown error"
  }
}

export default function PembayaranPage() {
  const router = useRouter()
  const { snapReady } = useMidtransSnap()
  const { createTransaction } = useOrder()

  const items = useCartStore((s) => s.items)
  const tableNumber = useCartStore((s) => s.tableNumber)
  const clearCart = useCartStore((s) => s.clearCart)
  const total = useCartStore((s) => s.getTotalAmount())

  const [method, setMethod] = useState<PaymentMethod>("midtrans")
  const [loading, setLoading] = useState(false)

  const payloadItems = useMemo(
    () =>
      items.map((it) => ({
        menu_item_id: it.id,
        name: it.name,
        quantity: it.quantity,
        price: it.price,
        notes: it.notes,
      })),
    [items],
  )

  if (!tableNumber) {
    return (
      <main className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="p-6 text-center max-w-md w-full">
          <p className="text-muted-foreground">Kamu belum memilih meja.</p>
        </Card>
      </main>
    )
  }

  const payMidtrans = async () => {
    if (!snapReady) return toast.error("Midtrans Snap belum siap. Refresh halaman.")
    if (items.length === 0) return toast.error("Keranjang kosong.")

    const { orderNumber, snapToken } = await createTransaction({
      tableNumber,
      items: payloadItems,
    })

    window.snap.pay(snapToken, {
      onSuccess: () => {
        clearCart()
        router.push(`/nota/${orderNumber}`)
      },
      onPending: () => router.push(`/nota/${orderNumber}`),
      onError: () => router.push(`/nota/${orderNumber}`),
      onClose: () => router.push(`/nota/${orderNumber}`),
    })
  }

  const payCash = async () => {
    if (items.length === 0) return toast.error("Keranjang kosong.")

    const res = await fetch("/api/orders/cash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tableNumber,
        items: payloadItems.map((it) => ({
          menu_item_id: it.menu_item_id,
          quantity: it.quantity,
          price: it.price,
          notes: it.notes,
        })),
      }),
    })

    const json: unknown = await res.json()

    if (!res.ok) {
      const msg =
        typeof json === "object" && json !== null && "message" in json
          ? String((json as Record<string, unknown>).message)
          : "Gagal membuat order cash"
      throw new Error(msg)
    }

    const orderNumber =
      typeof json === "object" && json !== null && "orderNumber" in json
        ? (json as Record<string, unknown>).orderNumber
        : null

    if (typeof orderNumber !== "string") throw new Error("Invalid response: orderNumber")

    clearCart()
    router.push(`/nota/${orderNumber}`)
  }

  const onPay = async () => {
    setLoading(true)
    try {
      if (method === "midtrans") await payMidtrans()
      else await payCash()
    } catch (e: unknown) {
      toast.error(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-foreground">Pembayaran</h2>
        <p className="text-muted-foreground mt-1">Review pesanan terakhir</p>
      </div>

      {/* Payment Card */}
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-medium">Nomor Meja</span>
            <span className="font-bold text-lg">{tableNumber}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-medium">Total</span>
            <span className="font-bold text-2xl text-primary">Rp {total.toLocaleString("id-ID")}</span>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="text-foreground font-semibold">Metode Pembayaran</div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={method === "midtrans" ? "default" : "outline"}
                onClick={() => setMethod("midtrans")}
                disabled={loading}
                className="font-semibold"
              >
                Online (Midtrans)
              </Button>

              <Button
                type="button"
                variant={method === "cash" ? "default" : "outline"}
                onClick={() => setMethod("cash")}
                disabled={loading}
                className="font-semibold"
              >
                Tunai
              </Button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed pt-2">
              {method === "midtrans"
                ? "Bayar via Midtrans Snap (QRIS, VA, dll)."
                : "Bayar tunai ke kasir. Nota akan menampilkan status menunggu konfirmasi kasir."}
            </p>
          </div>
        </Card>

        <Button
          className="w-full font-semibold h-12 text-base"
          onClick={onPay}
          disabled={loading || items.length === 0 || (method === "midtrans" && !snapReady)}
        >
          {loading ? "Memproses..." : method === "midtrans" ? "Bayar Sekarang" : "Buat Order Tunai"}
        </Button>
      </div>
    </main>
  )
}
