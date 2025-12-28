"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCartStore } from "@/store/cartStore"
import { formatRupiah } from "@/lib/utils"

type MenuItemWithCategory = {
  id: string
  category_id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_available: boolean
  created_at: string
  categories: { name: string } | null
}

export default function MenuPage() {
  const tableNumber = useCartStore((s) => s.tableNumber)
  const addItem = useCartStore((s) => s.addItem)
  const itemCount = useCartStore((s) => s.getItemCount())

  const [items, setItems] = useState<MenuItemWithCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"Makanan" | "Minuman">("Makanan")

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/menu-items?t=${Date.now()}`, { cache: "no-store" })
      const text = await res.text()
      const json: unknown = text ? JSON.parse(text) : null

      if (!res.ok) {
        const msg =
          typeof json === "object" && json !== null && "message" in json
            ? String((json as Record<string, unknown>).message)
            : "Gagal ambil menu"
        throw new Error(msg)
      }

      const payload = json as { items: MenuItemWithCategory[] }
      setItems(payload.items ?? [])
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = useMemo(() => {
    const want = tab.toLowerCase()
    return items.filter((it) => (it.categories?.name ?? "").toLowerCase() === want)
  }, [items, tab])

  return (
    <main className="min-h-screen bg-background p-6 space-y-6">
      {/* Header with Cart Button */}
      <div className="max-w-2xl mx-auto flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Menu</h2>
          <p className="text-muted-foreground mt-1">Meja {tableNumber ?? "-"}</p>
        </div>
        <Link href="/keranjang">
          <Button variant="default" className="font-semibold">
            Keranjang ({itemCount})
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto">
        <Tabs value={tab} onValueChange={(v) => setTab(v === "Minuman" ? "Minuman" : "Makanan")}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="Makanan" className="font-semibold">
              Makanan
            </TabsTrigger>
            <TabsTrigger value="Minuman" className="font-semibold">
              Minuman
            </TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <p className="text-muted-foreground">Loading menu...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex justify-center py-12">
                <p className="text-muted-foreground">Menu kosong / tidak tersedia.</p>
              </div>
            ) : (
              filtered.map((it) => (
                <Card
                  key={it.id}
                  className="p-5 flex items-start justify-between gap-4 hover:shadow-md transition-shadow border border-border/50"
                >
                  <div className="space-y-2 flex-1">
                    <div className="font-bold text-foreground text-lg">{it.name}</div>
                    {it.description ? <div className="text-sm text-muted-foreground">{it.description}</div> : null}
                    <div className="text-lg font-semibold text-primary">{formatRupiah(it.price)}</div>
                  </div>

                  <Button
                    onClick={() =>
                      addItem({
                        id: it.id,
                        name: it.name,
                        price: it.price,
                        quantity: 1,
                        image_url: it.image_url ?? undefined,
                      })
                    }
                    className="font-semibold whitespace-nowrap"
                  >
                    Tambah
                  </Button>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
