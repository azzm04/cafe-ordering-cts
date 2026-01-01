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
      <main className="min-h-screen bg-background p-4 sm:p-6 flex items-center justify-center">
        <Card className="p-6 sm:p-8 text-center max-w-md w-full border-muted">
          <p className="text-base sm:text-lg text-muted-foreground font-medium">Kamu belum memilih meja.</p>
          <Button
            onClick={() => router.push("/pilih-meja")}
            className="mt-4 w-full bg-primary hover:bg-primary/90 font-semibold"
          >
            Pilih Meja
          </Button>
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
    <main className="min-h-screen bg-background p-4 sm:p-6 space-y-6 sm:space-y-8">
      <div className="max-w-2xl mx-auto space-y-2">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">💳 Pembayaran</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Review pesanan dan pilih metode pembayaran</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
        <Card className="p-4 sm:p-6 space-y-4 sm:space-y-5 border-muted">
          {/* Table and total info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-muted/50">
              <span className="text-sm sm:text-base font-medium text-muted-foreground">Nomor Meja</span>
              <span className="text-lg sm:text-2xl font-bold text-primary">#{tableNumber}</span>
            </div>

            <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-primary/5 border border-primary/20">
              <span className="text-sm sm:text-base font-medium text-foreground">Total Pembayaran</span>
              <span className="text-2xl sm:text-3xl font-bold text-primary">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  maximumFractionDigits: 0,
                }).format(total)}
              </span>
            </div>
          </div>

          <Separator className="my-2" />

          {/* Payment method section */}
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-foreground">Metode Pembayaran</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Pilih cara pembayaran yang Anda inginkan</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                type="button"
                variant={method === "midtrans" ? "default" : "outline"}
                onClick={() => setMethod("midtrans")}
                disabled={loading}
                className={`h-12 sm:h-14 font-semibold text-sm sm:text-base transition-all ${
                  method === "midtrans"
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                    : "bg-card hover:bg-muted"
                }`}
              >
                💳 Online (Midtrans)
              </Button>

              <Button
                type="button"
                variant={method === "cash" ? "default" : "outline"}
                onClick={() => setMethod("cash")}
                disabled={loading}
                className={`h-12 sm:h-14 font-semibold text-sm sm:text-base transition-all ${
                  method === "cash"
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                    : "bg-card hover:bg-muted"
                }`}
              >
                💵 Tunai
              </Button>
            </div>

            {/* Payment method description */}
            <div className="p-3 sm:p-4 rounded-lg bg-muted/50 border border-muted">
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {method === "midtrans"
                  ? "✓ Bayar via Midtrans Snap dengan berbagai metode (QRIS, Bank Transfer, e-Wallet, dll)"
                  : "✓ Bayar tunai ke kasir. Nota akan menampilkan status menunggu konfirmasi kasir"}
              </p>
            </div>
          </div>
        </Card>

        <Button
          className="w-full bg-primary hover:bg-primary/90 font-bold h-12 sm:h-14 text-base sm:text-lg transition-all"
          onClick={onPay}
          disabled={loading || items.length === 0 || (method === "midtrans" && !snapReady)}
        >
          {loading ? "Memproses..." : method === "midtrans" ? "💳 Bayar Sekarang" : "✓ Buat Order Tunai"}
        </Button>

        {/* Safety note */}
        <p className="text-xs text-center text-muted-foreground">
          Transaksi Anda dijamin aman. Data disimpan terenkripsi.
        </p>
      </div>
    </main>
  )
}
