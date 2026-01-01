"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { Table } from "@/types"
import { useCartStore } from "@/store/cartStore"
import { TableSelector } from "@/components/TableSelector"
import { Button } from "@/components/ui/button"

export default function PilihMejaPage() {
  const router = useRouter()
  const setTableNumber = useCartStore((s) => s.setTableNumber)

  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)

  const loadTables = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/tables?t=${Date.now()}`, {
        cache: "no-store",
      })

      const json: unknown = await res.json()

      if (!res.ok) {
        const msg =
          typeof json === "object" && json !== null && "message" in json
            ? String((json as Record<string, unknown>).message)
            : "Gagal ambil data meja"
        throw new Error(msg)
      }

      const tablesData =
        typeof json === "object" && json !== null && "tables" in json ? (json as Record<string, unknown>).tables : []

      setTables(Array.isArray(tablesData) ? (tablesData as Table[]) : [])
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Error"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTables()
  }, [])

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 space-y-6 sm:space-y-8">
      <div className="max-w-4xl mx-auto">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground text-balance">Pilih Nomor Meja</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Memilih meja untuk memulai pengalaman berbelanja Anda
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto flex justify-end">
        <Button
          variant="outline"
          onClick={loadTables}
          disabled={loading}
          className="font-medium bg-card hover:bg-muted transition-colors"
        >
          {loading ? "Memuat..." : "🔄 Refresh"}
        </Button>
      </div>

      <div className="max-w-4xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16">
            <div className="inline-flex h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary mb-4"></div>
            <p className="text-sm sm:text-base text-muted-foreground">Memuat meja...</p>
          </div>
        ) : (
          <TableSelector
            tables={tables}
            onSelect={(n) => {
              setTableNumber(n)
              router.push("/menu")
            }}
          />
        )}
      </div>
    </main>
  )
}
