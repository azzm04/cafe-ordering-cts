"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import RestockModal from "@/components/admin/RestockModal"

type Item = {
  id: string
  name: string
  unit: string
  current_stock: number
  min_stock: number
  stock_status: "out_of_stock" | "low_stock" | "normal"
  used_in_menu_count: number
  active_alerts: number
}

export default function IngredientsList({
  initialItems,
  initialQ,
  initialStatus,
}: {
  initialItems: Item[]
  initialQ: string
  initialStatus: string
}) {
  const router = useRouter()
  const [q, setQ] = useState(initialQ)
  const [status, setStatus] = useState(initialStatus)
  const [openRestock, setOpenRestock] = useState<null | { id: string; name: string; unit: string; current: number }>(
    null,
  )
  const [isPending, startTransition] = useTransition()

  const items = useMemo(() => initialItems, [initialItems])
  const debounceRef = useRef<number | null>(null)

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current)

    debounceRef.current = window.setTimeout(() => {
      const sp = new URLSearchParams()
      if (q.trim()) sp.set("q", q.trim())
      if (status) sp.set("status", status)
      const qs = sp.toString()
      const url = qs ? `/admin/ingredients?${qs}` : "/admin/ingredients"
      startTransition(() => router.replace(url))
    }, 300)

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status])

  function statusBadge(s: Item["stock_status"]) {
    if (s === "out_of_stock")
      return (
        <Badge variant="destructive" className="text-xs">
          Habis
        </Badge>
      )
    if (s === "low_stock")
      return (
        <Badge variant="secondary" className="text-xs">
          Menipis
        </Badge>
      )
    return (
      <Badge variant="outline" className="text-xs">
        Aman
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 sm:space-y-0 sm:flex sm:gap-4 sm:items-end">
        <div className="flex-1">
          <label className="text-xs font-semibold text-muted-foreground block mb-2">Cari Bahan</label>
          <Input placeholder="Cari bahan…" value={q} onChange={(e) => setQ(e.target.value)} className="h-10 text-sm" />
        </div>

        <div className="w-full sm:w-48">
          <label className="text-xs font-semibold text-muted-foreground block mb-2">Status</label>
          <select
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            value={status}
            aria-label="select"
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Semua Status</option>
            <option value="normal">Aman</option>
            <option value="low_stock">Menipis</option>
            <option value="out_of_stock">Habis</option>
          </select>
        </div>
      </div>

      {/* Table wrapper with responsive overflow */}
      <div className="rounded-lg border border-border overflow-hidden overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">Nama</TableHead>
              <TableHead className="text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">Stok</TableHead>
              <TableHead className="text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">Min</TableHead>
              <TableHead className="text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">
                Status
              </TableHead>
              <TableHead className="text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap hidden sm:table-cell">
                Menu
              </TableHead>
              <TableHead className="text-xs sm:text-sm font-semibold text-foreground text-right whitespace-nowrap">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                  Belum ada bahan.
                </TableCell>
              </TableRow>
            ) : (
              items.map((it) => (
                <TableRow key={it.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="text-xs sm:text-sm font-medium whitespace-nowrap">{it.name}</TableCell>
                  <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                    {it.current_stock} {it.unit}
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                    {it.min_stock} {it.unit}
                  </TableCell>
                  <TableCell>{statusBadge(it.stock_status)}</TableCell>
                  <TableCell className="text-xs sm:text-sm hidden sm:table-cell">{it.used_in_menu_count}</TableCell>
                  <TableCell className="text-right space-x-1 sm:space-x-2 whitespace-nowrap">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 bg-transparent"
                      onClick={() =>
                        setOpenRestock({ id: it.id, name: it.name, unit: it.unit, current: it.current_stock })
                      }
                    >
                      Restock
                    </Button>
                    <Link href={`/admin/ingredients/${it.id}/edit`}>
                      <Button size="sm" variant="secondary" className="text-xs h-8">
                        Edit
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Restock modal */}
      <RestockModal
        open={!!openRestock}
        ingredient={openRestock}
        onClose={() => setOpenRestock(null)}
        onSuccess={() => router.refresh()}
      />
    </div>
  )
}
