"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type ReportResponse = {
  range: { from: string; to: string }
  totalOmzet: number
  breakdown: { cash: number; nonCash: number }
  topMenus: Array<{
    menu_item_id: string
    name: string
    qty: number
    omzet: number
  }>
}

type ApiErrorResponse = {
  message: string
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null
}

function isApiErrorResponse(v: unknown): v is ApiErrorResponse {
  return isObject(v) && typeof v.message === "string"
}

function isReportResponse(v: unknown): v is ReportResponse {
  if (!isObject(v)) return false

  const range = v.range
  const breakdown = v.breakdown
  const topMenus = v.topMenus

  if (!isObject(range) || typeof range.from !== "string" || typeof range.to !== "string") return false
  if (typeof v.totalOmzet !== "number") return false

  if (!isObject(breakdown) || typeof breakdown.cash !== "number" || typeof breakdown.nonCash !== "number") return false

  if (!Array.isArray(topMenus)) return false

  for (const m of topMenus) {
    if (!isObject(m)) return false
    if (typeof m.menu_item_id !== "string") return false
    if (typeof m.name !== "string") return false
    if (typeof m.qty !== "number") return false
    if (typeof m.omzet !== "number") return false
  }

  return true
}

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n)
}

function yyyyMmDd(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function addDays(d: Date, days: number) {
  const x = new Date(d)
  x.setDate(x.getDate() + days)
  return x
}

function getErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message
  if (typeof e === "string") return e
  return "Unknown error"
}

export default function AdminLaporanPage() {
  const router = useRouter()

  const today = useMemo(() => new Date(), [])
  const [from, setFrom] = useState<string>(yyyyMmDd(startOfMonth(today)))
  const [to, setTo] = useState<string>(yyyyMmDd(today))

  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [data, setData] = useState<ReportResponse | null>(null)

  const quickToday = () => {
    const t = new Date()
    setFrom(yyyyMmDd(t))
    setTo(yyyyMmDd(t))
  }

  const quickLast7Days = () => {
    const t = new Date()
    setFrom(yyyyMmDd(addDays(t, -6)))
    setTo(yyyyMmDd(t))
  }

  const quickLast30Days = () => {
    const t = new Date()
    setFrom(yyyyMmDd(addDays(t, -29)))
    setTo(yyyyMmDd(t))
  }

  const quickThisMonth = () => {
    const t = new Date()
    setFrom(yyyyMmDd(startOfMonth(t)))
    setTo(yyyyMmDd(t))
  }

  const fetchReport = async () => {
    setLoading(true)
    setErr(null)

    try {
      const res = await fetch(`/api/admin/reports/summary?from=${from}&to=${to}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      })

      if (res.status === 401) {
        router.replace("/admin/login")
        return
      }
      if (res.status === 403) {
        router.replace("/admin")
        return
      }

      const json: unknown = await res.json().catch(() => null)

      if (!res.ok) {
        const msg = isApiErrorResponse(json) ? json.message : "Gagal memuat laporan"
        throw new Error(msg)
      }

      if (!isReportResponse(json)) {
        throw new Error("Format response laporan tidak valid")
      }

      setData(json)
    } catch (e: unknown) {
      setErr(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  const handleQuickFilter = async (filterFn: () => void) => {
    filterFn()
    setTimeout(() => fetchReport(), 0)
  }

  useEffect(() => {
    fetchReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stats = useMemo(() => {
    if (!data) return null
    const totalOrders = data.topMenus.reduce((sum, m) => sum + m.qty, 0)
    const avgOrderValue = totalOrders > 0 ? data.totalOmzet / totalOrders : 0
    const cashPercentage = data.totalOmzet > 0 ? (data.breakdown.cash / data.totalOmzet) * 100 : 0
    const nonCashPercentage = 100 - cashPercentage
    return {
      totalOrders,
      avgOrderValue,
      cashPercentage,
      nonCashPercentage,
    }
  }, [data])

  const exportCSV = () => {
    if (!data) return

    const rows = [
      ["Laporan Penjualan Coklat Tepi Sawah"],
      [`Periode: ${data.range.from} hingga ${data.range.to}`],
      [],
      ["RINGKASAN"],
      ["Metrik", "Nilai"],
      ["Total Omzet", formatIDR(data.totalOmzet)],
      ["Cash", formatIDR(data.breakdown.cash)],
      ["Non-Cash", formatIDR(data.breakdown.nonCash)],
      ["Total Item Terjual", stats?.totalOrders.toString() || "0"],
      ["Nilai Rata-rata Per Item", formatIDR(stats?.avgOrderValue || 0)],
      [],
      ["MENU TERLARIS (TOP 10)"],
      ["Rank", "Nama Menu", "Jumlah Terjual", "Omzet"],
      ...data.topMenus.map((m, idx) => [(idx + 1).toString(), m.name, m.qty.toString(), formatIDR(m.omzet)]),
    ]

    const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `laporan-${data.range.from}-${data.range.to}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Laporan Penjualan</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Analisis omzet, penjualan menu, dan insights bisnis Anda
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
            <Button variant="outline" onClick={() => router.push("/admin")} className="flex-1 sm:flex-none text-sm">
              Kembali
            </Button>
            <Button onClick={handlePrint} variant="outline" className="flex-1 sm:flex-none text-sm bg-transparent">
              Cetak
            </Button>
            <Button onClick={exportCSV} disabled={!data} className="flex-1 sm:flex-none text-sm">
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filter Section - Improved for Mobile */}
        <Card className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Date Inputs */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            <div className="col-span-1 flex flex-col gap-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Dari</label>
              <input
                type="date"
                aria-label="date"
                className="h-10 px-3 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>

            <div className="col-span-1 flex flex-col gap-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Sampai</label>
              <input
                type="date"
                aria-label="date"
                className="h-10 px-3 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>

            <div className="col-span-2 sm:col-span-1 flex flex-col gap-2 sm:justify-end">
              <label className="text-xs font-semibold text-muted-foreground uppercase invisible">_</label>
              <Button onClick={fetchReport} disabled={loading} className="h-10 text-sm font-medium">
                {loading ? "Memuat..." : "Terapkan"}
              </Button>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => handleQuickFilter(quickToday)}
              disabled={loading}
              className="text-xs sm:text-sm flex-1 sm:flex-none bg-transparent"
            >
              Hari ini
            </Button>
            <Button
              variant="outline"
              onClick={() => handleQuickFilter(quickLast7Days)}
              disabled={loading}
              className="text-xs sm:text-sm flex-1 sm:flex-none bg-transparent"
            >
              7 hari
            </Button>
            <Button
              variant="outline"
              onClick={() => handleQuickFilter(quickLast30Days)}
              disabled={loading}
              className="text-xs sm:text-sm flex-1 sm:flex-none bg-transparent"
            >
              30 hari
            </Button>
            <Button
              variant="outline"
              onClick={() => handleQuickFilter(quickThisMonth)}
              disabled={loading}
              className="text-xs sm:text-sm flex-1 sm:flex-none bg-transparent"
            >
              Bulan ini
            </Button>
          </div>

          {/* Status Messages */}
          <div className="space-y-2">
            {err && <p className="text-sm text-destructive font-medium">{err}</p>}
            {data && (
              <p className="text-sm text-muted-foreground">
                Range: <span className="font-semibold text-foreground">{data.range.from}</span> s/d{" "}
                <span className="font-semibold text-foreground">{data.range.to}</span>
              </p>
            )}
          </div>
        </Card>

        {/* Main Statistics Grid */}
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="grid gap-4 grid-cols-5 sm:grid-cols-5 lg:grid-cols-5 min-w-full sm:min-w-0 px-4 sm:px-0">
            <Card className="p-4 sm:p-6 flex-shrink-0 sm:flex-shrink">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                Total Omzet
              </p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold mt-3 break-words">
                {data ? formatIDR(data.totalOmzet) : "-"}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {data && stats ? `${stats.totalOrders} item terjual` : "-"}
              </p>
            </Card>

            <Card className="p-4 sm:p-6 flex-shrink-0 sm:flex-shrink">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                Cash
              </p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold mt-3 break-words">
                {data ? formatIDR(data.breakdown.cash) : "-"}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {data && stats ? `${stats.cashPercentage.toFixed(1)}%` : "-"}
              </p>
            </Card>

            <Card className="p-4 sm:p-6 flex-shrink-0 sm:flex-shrink">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                Non-Cash
              </p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold mt-3 break-words">
                {data ? formatIDR(data.breakdown.nonCash) : "-"}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {data && stats ? `${stats.nonCashPercentage.toFixed(1)}%` : "-"}
              </p>
            </Card>

            <Card className="p-4 sm:p-6 flex-shrink-0 sm:flex-shrink">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                Total Item
              </p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold mt-3">
                {data && stats ? stats.totalOrders : "-"}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {data && stats ? `Rp ${Math.floor(stats.avgOrderValue).toLocaleString("id-ID")}/item` : "-"}
              </p>
            </Card>

            <Card className="p-4 sm:p-6 flex-shrink-0 sm:flex-shrink">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                Rata-rata
              </p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold mt-3 break-words">
                {data && stats ? formatIDR(stats.avgOrderValue) : "-"}
              </p>
              <p className="text-xs text-muted-foreground mt-2">per item</p>
            </Card>
          </div>
        </div>

        {/* Payment Method Breakdown */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold">Analisis Metode Pembayaran</h2>
          {data && stats ? (
            <div className="mt-6 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Cash</span>
                  <span className="text-sm sm:text-base font-semibold">{stats.cashPercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${stats.cashPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">{formatIDR(data.breakdown.cash)}</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Non-Cash</span>
                  <span className="text-sm sm:text-base font-semibold">{stats.nonCashPercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary transition-all duration-500"
                    style={{ width: `${stats.nonCashPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">{formatIDR(data.breakdown.nonCash)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-4">Belum ada data</p>
          )}
        </Card>

        {/* Top 10 Menu */}
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <h2 className="text-lg sm:text-xl font-semibold">Menu Terlaris</h2>
            <p className="text-xs text-muted-foreground">Top 10</p>
          </div>

          <div className="space-y-3">
            {!data ? (
              <p className="text-sm text-muted-foreground py-4">Memuat data...</p>
            ) : data.topMenus.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Tidak ada transaksi pada periode ini</p>
            ) : (
              data.topMenus.map((m, idx) => (
                <div
                  key={m.menu_item_id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="text-xs font-bold text-primary w-6 flex-shrink-0">{idx + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.qty} terjual</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-muted-foreground">Omzet</p>
                    <p className="font-semibold text-sm">{formatIDR(m.omzet)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Quick Insights */}
        <Card className="p-4 sm:p-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
          <h2 className="text-lg sm:text-xl font-semibold mb-6">Insight Cepat</h2>
          {data && stats ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Menu Terlaris</p>
                <p className="font-semibold text-sm sm:text-base mt-2">
                  {data.topMenus[0]?.name || "-"}{" "}
                  <span className="text-muted-foreground">({data.topMenus[0]?.qty || 0} terjual)</span>
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Periode Laporan</p>
                <p className="font-semibold text-sm sm:text-base mt-2">
                  {data.range.from} hingga {data.range.to}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Metode Dominan</p>
                <p className="font-semibold text-sm sm:text-base mt-2">
                  {stats.cashPercentage > 50 ? "Cash" : "Non-Cash"} (
                  {Math.max(stats.cashPercentage, stats.nonCashPercentage).toFixed(1)}%)
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Nilai Rata-rata</p>
                <p className="font-semibold text-sm sm:text-base mt-2">{formatIDR(stats.avgOrderValue)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada data untuk ditampilkan</p>
          )}
        </Card>
      </div>
    </main>
  )
}
