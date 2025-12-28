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
    <main className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-foreground">Pilih Nomor Meja</h2>
        <p className="text-muted-foreground mt-1">Pilih meja yang tersedia.</p>
      </div>

      {/* Refresh Button */}
      <div className="max-w-2xl mx-auto flex justify-end">
        <Button variant="outline" onClick={loadTables} disabled={loading} className="font-medium bg-transparent">
          {loading ? "Memuat..." : "Refresh"}
        </Button>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <p className="text-muted-foreground">Loading meja...</p>
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
