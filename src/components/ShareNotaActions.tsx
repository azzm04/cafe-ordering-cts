"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Check, Copy, Share2, AlertCircle } from "lucide-react"

type Props = {
  orderNumber: string
  tableNumber?: number | null
  totalAmount: number
  noteUrl?: string
}

type ShareState = { type: "success" | "error"; message: string } | null

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n)
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // ignore and fallback
  }

  try {
    const el = document.createElement("textarea")
    el.value = text
    el.setAttribute("readonly", "true")
    el.style.position = "fixed"
    el.style.left = "-9999px"
    document.body.appendChild(el)
    el.select()
    const ok = document.execCommand("copy")
    document.body.removeChild(el)
    return ok
  } catch {
    return false
  }
}

export function ShareNotaActions({ orderNumber, tableNumber, totalAmount, noteUrl }: Props) {
  const [state, setState] = useState<ShareState>(null)

  const url = useMemo(() => {
    if (noteUrl) return noteUrl
    if (typeof window === "undefined") return ""
    return window.location.href
  }, [noteUrl])

  const shareText = useMemo(() => {
    const meja = tableNumber ? `Meja ${tableNumber}` : "Meja -"
    const total = formatIDR(totalAmount)
    return `Nota Coklat Tepi Sawah\nOrder: ${orderNumber}\n${meja}\nTotal: ${total}\n\nCek status di sini:\n${url}`
  }, [orderNumber, tableNumber, totalAmount, url])

  const toast = (type: "success" | "error", message: string) => {
    setState({ type, message })
    window.setTimeout(() => setState(null), 2500)
  }

  const onShare = async () => {
    if (!url) return

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Nota Coklat Tepi Sawah",
          text: shareText,
          url,
        })
        return
      } catch (e) {
        // user cancel atau gagal -> fallback ke copy
        // tidak perlu error kalau user cancel
      }
    }

    // fallback: copy link
    const ok = await copyToClipboard(url)
    toast(
      ok ? "success" : "error",
      ok ? "Link nota berhasil disalin ke clipboard" : "Gagal menyalin link. Silakan coba lagi.",
    )
  }

  const onCopy = async () => {
    if (!url) return
    const ok = await copyToClipboard(url)
    toast(ok ? "success" : "error", ok ? "Link nota berhasil disalin" : "Gagal menyalin link")
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button type="button" className="h-11 font-semibold" onClick={onShare}>
          <Share2 className="w-4 h-4 mr-2" />
          Bagikan
        </Button>

        <Button type="button" variant="outline" className="h-11 font-semibold bg-transparent" onClick={onCopy}>
          <Copy className="w-4 h-4 mr-2" />
          Salin Link
        </Button>
      </div>

      <div className="flex gap-3 p-4 rounded-lg bg-secondary/10 border border-secondary/20">
        <AlertCircle className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          Simpan link ini untuk melihat status pesanan kapan saja
        </p>
      </div>

      {state && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium transition-all ${
            state.type === "error"
              ? "bg-red-50 border border-red-200 text-red-700"
              : "bg-emerald-50 border border-emerald-200 text-emerald-700"
          }`}
        >
          {state.type === "success" ? (
            <Check className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{state.message}</span>
        </div>
      )}
    </div>
  )
}
