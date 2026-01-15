"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Plus, Trash2, TicketPercent, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { formatRupiah } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type Voucher = {
  id: string
  code: string
  type: "percentage" | "fixed"
  value: number
  min_order_amount: number
  max_discount: number | null
  is_active: boolean
}

export default function VoucherManager() {
  // --- STATE ---
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState("")
  const [type, setType] = useState<"percentage" | "fixed">("percentage")
  const [value, setValue] = useState("")
  const [minOrder, setMinOrder] = useState("0")
  const [maxDiscount, setMaxDiscount] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  useEffect(() => {
    fetchVouchers()
  }, [])

  const fetchVouchers = async () => {
    try {
      const res = await fetch("/api/admin/vouchers")
      if (res.ok) {
        const data = await res.json()
        setVouchers(data)
      }
    } catch (error) {
      console.error("Gagal load voucher", error)
    }
  }

  // --- LOGIC: CREATE VOUCHER ---
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code || !value) {
      toast.error("Kode dan Nilai harus diisi")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/admin/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          type,
          value,
          min_order_amount: minOrder,
          max_discount: type === "percentage" ? maxDiscount : null,
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.message || "Gagal membuat voucher")

      toast.success("Voucher berhasil dibuat!")
      fetchVouchers() 

      // Reset Form
      setCode("")
      setValue("")
      setMinOrder("0")
      setMaxDiscount("")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error")
    } finally {
      setLoading(false)
    }
  }

  // --- LOGIC: DELETE VOUCHER ---
  const confirmDelete = (id: string) => {
    setDeleteId(id)
    setIsDeleteDialogOpen(true)
  }

  const executeDelete = async () => {
    if (!deleteId) return

    try {
      const res = await fetch(`/api/admin/vouchers?id=${deleteId}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Voucher berhasil dihapus")
        fetchVouchers() // Refresh list
      } else {
        toast.error("Gagal menghapus voucher")
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem")
    } finally {
      setIsDeleteDialogOpen(false)
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-6"> 
      
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        
        {/* LEFT: FORM INPUT */}
        <Card className="p-4 sm:p-6 bg-card border-border/60 h-fit">
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h3 className="font-bold text-lg sm:text-xl">Buat Voucher Baru</h3>
          </div>

          <form onSubmit={handleCreate} className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm font-medium">Kode Voucher (Unik)</Label>
              <Input
                placeholder="Contoh: MERDEKA45"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ""))}
                className="uppercase font-mono tracking-wider text-sm sm:text-base"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm font-medium">Tipe Diskon</Label>
                <select
                  aria-label="select tipe diskon"
                  className="flex h-9 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={type}
                  onChange={(e) => setType(e.target.value as "percentage" | "fixed")}
                >
                  <option value="percentage">Persentase (%)</option>
                  <option value="fixed">Potongan Harga (Rp)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm font-medium">
                  {type === "percentage" ? "Persen (%)" : "Nominal (Rp)"}
                </Label>
                <Input
                  type="number"
                  placeholder={type === "percentage" ? "10" : "5000"}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="text-sm sm:text-base"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm font-medium">Min. Belanja (Rp)</Label>
                <Input
                  type="number"
                  value={minOrder}
                  onChange={(e) => setMinOrder(e.target.value)}
                  className="text-sm sm:text-base"
                />
              </div>

              <div className="space-y-2">
                <Label
                  className={`text-xs sm:text-sm font-medium ${type === "fixed" ? "text-muted-foreground" : ""}`}
                >
                  Max Potongan (Rp)
                </Label>
                <Input
                  type="number"
                  placeholder="Unlimited"
                  value={maxDiscount}
                  onChange={(e) => setMaxDiscount(e.target.value)}
                  disabled={type === "fixed"}
                  className={`text-sm sm:text-base ${type === "fixed" ? "opacity-50" : ""}`}
                />
              </div>
            </div>

            <Button type="submit" className="w-full mt-2 sm:mt-4 text-sm sm:text-base h-9 sm:h-10" disabled={loading}>
              {loading ? (
                <Loader2 className="animate-spin w-4 h-4 mr-2" />
              ) : (
                <TicketPercent className="w-4 h-4 mr-2" />
              )}
              Simpan Voucher
            </Button>
          </form>
        </Card>

        {/* RIGHT: LIST VOUCHER */}
        <Card className="p-4 sm:p-6 bg-card border-border/60">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <TicketPercent className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg sm:text-xl">Voucher Aktif</h3>
                {vouchers.length > 0 && (
                  <span className="ml-auto text-xs sm:text-sm text-muted-foreground bg-muted px-2 sm:px-3 py-1 rounded-full">
                    {vouchers.length} voucher
                  </span>
                )}
              </div>
            </div>
            {vouchers.length > 0 && (
              <span className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary/15 text-primary text-xs sm:text-sm font-semibold">
                {vouchers.length}
              </span>
            )}
          </div>

          <div className="space-y-2 sm:space-y-3 max-h-150 overflow-y-auto pr-2">
            {vouchers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                <TicketPercent className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground mb-2" />
                <p className="text-center text-muted-foreground text-xs sm:text-sm">Belum ada voucher aktif</p>
              </div>
            ) : (
              vouchers.map((v) => (
                <div
                  key={v.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-lg border border-border/60 bg-background/50 hover:bg-muted/30 transition-colors group"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-primary text-sm sm:text-base break-all">
                        {v.code}
                      </span>
                      <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-secondary/20 text-secondary font-medium uppercase whitespace-nowrap">
                        {v.type === "percentage" ? "Diskon %" : "Potongan"}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {v.type === "percentage"
                        ? `Diskon ${v.value}% ${v.max_discount ? `(Max ${formatRupiah(v.max_discount)})` : ""}`
                        : `Potongan ${formatRupiah(v.value)}`}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground/70">
                      Min. Belanja: {formatRupiah(v.min_order_amount)}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 mt-2 sm:mt-0 self-start sm:self-auto"
                    onClick={() => confirmDelete(v.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="sm:max-w-106.25">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Hapus Voucher?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak bisa dibatalkan. Pelanggan tidak akan bisa lagi menggunakan kode voucher ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}