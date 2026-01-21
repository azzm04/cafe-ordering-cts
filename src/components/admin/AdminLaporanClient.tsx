"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format, startOfMonth, subDays } from "date-fns"; 
import { HourlyChart } from "@/components/admin/hourly-chart";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Wallet, 
  CreditCard, 
  ShoppingCart, 
  DollarSign, 
  Package 
} from "lucide-react";

// --- TIPE DATA ---
type TopMenu = {
  name: string;
  qty: number;
  omzet: number;
};

type ReportResponse = {
  range: { from: string; to: string };
  summary: {
    omzet: number;
    hpp: number;
    profit: number;
    transactions: number;
  };
  breakdown: { cash: number; nonCash: number };
  topMenus: TopMenu[];
  hourlyStats: number[];
};

type ApiErrorResponse = {
  message: string;
};


// --- HELPER FUNCTIONS ---
function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

// --- KOMPONEN GRAFIK (Hourly Chart - Gradient Style) ---
// export function HourlyChart({ data }: HourlyChartProps) {
//   const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

//   const chartData = useMemo(() => {
//     const maxVal = Math.max(...data, 1);
//     const total = data.reduce((a, b) => a + b, 0);
//     const isEmpty = total === 0;

//     const width = 500;
//     const height = 160;
//     const padding = { top: 20, right: 20, bottom: 30, left: 20 };
//     const chartWidth = width - padding.left - padding.right;
//     const chartHeight = height - padding.top - padding.bottom;

//     const points = data.map((val, idx) => {
//       const x = padding.left + (idx / (data.length - 1)) * chartWidth;
//       const y = padding.top + chartHeight - (val / maxVal) * chartHeight;
//       return { x, y, val, hour: idx };
//     });

//     // Create smooth bezier curve path
//     let pathD = "";
//     if (points.length > 0 && !isEmpty) {
//       pathD = `M ${points[0].x} ${points[0].y}`;

//       for (let i = 0; i < points.length - 1; i++) {
//         const p0 = points[Math.max(0, i - 1)];
//         const p1 = points[i];
//         const p2 = points[i + 1];
//         const p3 = points[Math.min(points.length - 1, i + 2)];

//         const tension = 0.35;
//         const cp1x = p1.x + (p2.x - p0.x) * tension;
//         const cp1y = p1.y + (p2.y - p0.y) * tension;
//         const cp2x = p2.x - (p3.x - p1.x) * tension;
//         const cp2y = p2.y - (p3.y - p1.y) * tension;

//         pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
//       }
//     }

//     // Area path (closed)
//     const areaPath = pathD
//       ? `${pathD} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`
//       : "";

//     return { maxVal, total, isEmpty, points, pathD, areaPath, width, height, padding, chartWidth, chartHeight };
//   }, [data]);

//   const { maxVal, total, isEmpty, points, pathD, areaPath, width, height, padding, chartHeight } = chartData;
//   const baselineY = padding.top + chartHeight;

//   // Hours to display on X axis
//   const xLabels = [0, 3, 6, 9, 12, 15, 18, 21, 23];

//   // Empty State
//   if (isEmpty) {
//     return (
//       <div className="w-full">
//         <div className="relative w-full h-44 flex items-center justify-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
//           <div className="text-center">
//             <p className="text-3xl font-bold text-slate-300">0</p>
//             <p className="text-sm text-slate-400 mt-1">Belum ada transaksi hari ini</p>
//           </div>
//         </div>
//         <div className="flex justify-between text-xs text-slate-400 mt-3 px-2">
//           {xLabels.map((h) => (
//             <span key={h}>{String(h).padStart(2, "0")}:00</span>
//           ))}
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="w-full">
//       {/* Chart Container */}
//       <div className="relative w-full">
//         <svg
//           viewBox={`0 0 ${width} ${height}`}
//           className="w-full h-44"
//           preserveAspectRatio="xMidYMid meet"
//           onMouseLeave={() => setHoveredIndex(null)}
//         >
//           <defs>
//             {/* Gradient for area fill */}
//             <linearGradient id="areaGradientBlue" x1="0" y1="0" x2="0" y2="1">
//               <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
//               <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
//             </linearGradient>

//             {/* Gradient for line */}
//             <linearGradient id="lineGradientBlue" x1="0" y1="0" x2="1" y2="0">
//               <stop offset="0%" stopColor="#3b82f6" />
//               <stop offset="100%" stopColor="#60a5fa" />
//             </linearGradient>
//           </defs>

//           {/* Horizontal grid lines */}
//           {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
//             <line
//               key={i}
//               x1={padding.left}
//               y1={padding.top + chartHeight * (1 - ratio)}
//               x2={width - padding.right}
//               y2={padding.top + chartHeight * (1 - ratio)}
//               stroke="#e2e8f0"
//               strokeWidth={1}
//               strokeDasharray={ratio === 0 ? "0" : "4 4"}
//             />
//           ))}

//           {/* Area fill */}
//           <path d={areaPath} fill="url(#areaGradientBlue)" />

//           {/* Main line */}
//           <path
//             d={pathD}
//             fill="none"
//             stroke="url(#lineGradientBlue)"
//             strokeWidth={2.5}
//             strokeLinecap="round"
//             strokeLinejoin="round"
//           />

//           {/* Interactive hover areas */}
//           {points.map((point, idx) => (
//             <rect
//               key={idx}
//               x={point.x - 10}
//               y={padding.top}
//               width={20}
//               height={chartHeight}
//               fill="transparent"
//               onMouseEnter={() => setHoveredIndex(idx)}
//               className="cursor-pointer"
//             />
//           ))}

//           {/* Hover effects */}
//           {hoveredIndex !== null && points[hoveredIndex] && (
//             <>
//               {/* Vertical line */}
//               <line
//                 x1={points[hoveredIndex].x}
//                 y1={padding.top}
//                 x2={points[hoveredIndex].x}
//                 y2={baselineY}
//                 stroke="#3b82f6"
//                 strokeWidth={1}
//                 strokeDasharray="4 4"
//                 strokeOpacity={0.5}
//               />

//               {/* Outer glow circle */}
//               <circle
//                 cx={points[hoveredIndex].x}
//                 cy={points[hoveredIndex].y}
//                 r={12}
//                 fill="#3b82f6"
//                 fillOpacity={0.15}
//               />

//               {/* Main dot */}
//               <circle
//                 cx={points[hoveredIndex].x}
//                 cy={points[hoveredIndex].y}
//                 r={6}
//                 fill="#ffffff"
//                 stroke="#3b82f6"
//                 strokeWidth={2.5}
//               />
//             </>
//           )}

//           {/* X-axis labels */}
//           {xLabels.map((hour) => {
//             const x = padding.left + (hour / 23) * (width - padding.left - padding.right);
//             return (
//               <text
//                 key={hour}
//                 x={x}
//                 y={height - 8}
//                 textAnchor="middle"
//                 className="fill-slate-400 text-[11px]"
//               >
//                 {String(hour).padStart(2, "0")}:00
//               </text>
//             );
//           })}
//         </svg>

//         {/* Tooltip */}
//         {hoveredIndex !== null && points[hoveredIndex] && (
//           <div
//             className="absolute transform -translate-x-1/2 bg-white border border-slate-200 text-slate-700 text-xs px-3 py-2 rounded-lg shadow-lg pointer-events-none whitespace-nowrap z-10"
//             style={{
//               left: `${(points[hoveredIndex].x / width) * 100}%`,
//               top: `${((points[hoveredIndex].y - 15) / height) * 100}%`,
//               transform: "translate(-50%, -100%)",
//             }}
//           >
//             <p className="text-[10px] text-slate-400 mb-0.5">
//               Jam {String(hoveredIndex).padStart(2, "0")}:00
//             </p>
//             <p className="text-sm font-semibold text-slate-800">
//               {points[hoveredIndex].val} Transaksi
//             </p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// --- KOMPONEN UTAMA ---
export default function AdminLaporanClient() {
  const router = useRouter();
  const today = useMemo(() => new Date(), []);
  
  // 2. USE DATE-FNS FOR INITIAL STATE
  // Format tanggal ke "yyyy-MM-dd" untuk input type="date"
  const [from, setFrom] = useState<string>(format(startOfMonth(today), "yyyy-MM-dd"));
  const [to, setTo] = useState<string>(format(today, "yyyy-MM-dd"));

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<ReportResponse | null>(null);

  // --- Fetch Data ---
  const fetchReportManual = async (startDate: string, endDate: string) => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/reports/summary?from=${startDate}&to=${endDate}`, {
        cache: "no-store",
      });

      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }

      const json = await res.json() as unknown;

      if (!res.ok) {
        const message = (json as ApiErrorResponse)?.message || "Gagal memuat laporan";
        throw new Error(message);
      }

      setData(json as ReportResponse);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Terjadi kesalahan yang tidak diketahui");
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = () => fetchReportManual(from, to);

  // 3. USE DATE-FNS FOR QUICK FILTERS
  const handleQuickFilter = (type: 'today' | '7days' | '30days' | 'month') => {
    const t = new Date();
    let newFrom = "";
    const newTo = format(t, "yyyy-MM-dd");

    switch (type) {
        case 'today':
            newFrom = format(t, "yyyy-MM-dd");
            break;
        case '7days':
            // Mundur 6 hari ke belakang (total 7 hari termasuk hari ini)
            newFrom = format(subDays(t, 6), "yyyy-MM-dd");
            break;
        case '30days':
            newFrom = format(subDays(t, 29), "yyyy-MM-dd");
            break;
        case 'month':
            newFrom = format(startOfMonth(t), "yyyy-MM-dd");
            break;
    }

    setFrom(newFrom);
    setTo(newTo);
    void fetchReportManual(newFrom, newTo);
  };

  useEffect(() => {
    void fetchReportManual(from, to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportCSV = () => {
    if (!data) return;
    const rows = [
      ["Laporan Penjualan Coklat Tepi Sawah"],
      [`Periode: ${data.range.from} s/d ${data.range.to}`],
      [],
      ["RINGKASAN"],
      ["Total Omzet", formatIDR(data.summary.omzet)],
      ["Total HPP", formatIDR(data.summary.hpp)],
      ["Total Profit", formatIDR(data.summary.profit)],
      ["Transaksi", data.summary.transactions.toString()],
      [],
      ["MENU TERLARIS"],
      ["Nama", "Qty", "Omzet"],
      ...data.topMenus.map(m => [m.name, m.qty.toString(), formatIDR(m.omzet)])
    ];

    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Laporan_${data.range.from}_${data.range.to}.csv`;
    link.click();
  };

  return (
    <main className="min-h-screen bg-background pb-10">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Laporan Penjualan</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Analisis omzet, profitabilitas, dan tren penjualan
            </p>
          </div>
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
             <Button variant="outline" onClick={() => router.push("/admin")}>Kembali</Button>
             <Button onClick={() => window.print()} variant="secondary">Cetak PDF</Button>
             <Button onClick={exportCSV} disabled={!data}>Export CSV</Button>
          </div>
        </div>

        {/* FILTER CONTROL */}
        <Card className="p-4 bg-muted/20 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="grid grid-cols-2 gap-4 flex-1 w-full">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Dari Tanggal</label>
                <input 
                  aria-label="input dari tanggal laporan"
                  type="date" 
                  value={from} 
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Sampai Tanggal</label>
                <input 
                  aria-label="input sampai tanggal laporan"
                  type="date" 
                  value={to} 
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border text-sm"
                />
              </div>
            </div>
            <Button onClick={fetchReport} disabled={loading} className="w-full sm:w-auto">
              {loading ? "Memuat..." : "Terapkan Laporan"}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
            <Button variant="outline" size="sm" onClick={() => handleQuickFilter('today')} className="bg-background">Hari ini</Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickFilter('7days')} className="bg-background">7 hari terakhir</Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickFilter('30days')} className="bg-background">30 hari terakhir</Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickFilter('month')} className="bg-background">Bulan ini</Button>
          </div>

          {err && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md font-medium">{err}</div>}
        </Card>

        {/* KONTEN UTAMA */}
        {data && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* 1. EMPAT KARTU UTAMA (Omzet, HPP, Profit, Transaksi) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Omzet */}
              <Card className="p-5 border-l-4 border-l-primary shadow-sm bg-gradient-to-br from-card to-primary/5">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wide">Total Omzet</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-primary truncate" title={formatIDR(data.summary.omzet)}>
                    {formatIDR(data.summary.omzet)}
                </div>
              </Card>

              {/* HPP */}
              <Card className="p-5 border-l-4 border-l-orange-500 shadow-sm bg-gradient-to-br from-card to-orange-500/5">
                <div className="flex items-center gap-2 text-orange-600 mb-2">
                  <Package className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wide">Total HPP</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-orange-700 truncate" title={formatIDR(data.summary.hpp)}>
                    {formatIDR(data.summary.hpp)}
                </div>
              </Card>

              {/* Profit */}
              <Card className="p-5 border-l-4 border-l-emerald-500 shadow-sm bg-gradient-to-br from-emerald-50/30 to-emerald-500/5">
                <div className="flex items-center gap-2 text-emerald-600 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wide">Total Profit</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-emerald-700 truncate" title={formatIDR(data.summary.profit)}>
                    {formatIDR(data.summary.profit)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Margin: {data.summary.omzet > 0 ? ((data.summary.profit / data.summary.omzet) * 100).toFixed(1) : 0}%
                </p>
              </Card>

              {/* Transaksi */}
              <Card className="p-5 border-l-4 border-l-purple-500 shadow-sm bg-gradient-to-br from-card to-purple-500/5">
                <div className="flex items-center gap-2 text-purple-600 mb-2">
                  <ShoppingCart className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wide">Transaksi</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold">{data.summary.transactions}</div>
                <p className="text-xs text-muted-foreground mt-1">Order selesai</p>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* 2. CHART & PAYMENT */}
              <Card className="p-6 lg:col-span-2 flex flex-col">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold">Grafik Kepadatan Transaksi</h3>
                  <p className="text-xs text-muted-foreground">Distribusi keramaian per jam (24 Jam)</p>
                </div>
                
                {/* Custom Gradient Chart */}
                <HourlyChart data={data.hourlyStats} />
                
                {/* Metode Pembayaran (Compact) */}
                <div className="mt-8 pt-5 border-t border-border/60">
                  <h4 className="text-sm font-semibold mb-3">Metode Pembayaran</h4>
                  <div className="flex gap-8 text-sm mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-100 rounded text-blue-600"><Wallet className="w-3 h-3" /></div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Cash</span>
                        <span className="font-bold">{formatIDR(data.breakdown.cash)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-slate-100 rounded text-slate-600"><CreditCard className="w-3 h-3" /></div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Non-Cash</span>
                        <span className="font-bold">{formatIDR(data.breakdown.nonCash)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Visual Bar */}
                  <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden flex">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                      style={{ width: `${(data.breakdown.cash / (data.summary.omzet || 1)) * 100}%` }}
                    />
                    <div 
                      className="h-full bg-slate-400 transition-all duration-500" 
                      style={{ width: `${(data.breakdown.nonCash / (data.summary.omzet || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </Card>

              {/* 3. TOP MENU */}
              <Card className="p-6 h-fit">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-semibold">Menu Terlaris</h3>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">TOP 5</span>
                </div>
                
                <div className="space-y-4">
                  {data.topMenus.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8 bg-muted/20 rounded-lg border border-dashed border-border/50">
                      Belum ada data penjualan.
                    </p>
                  ) : (
                    data.topMenus.map((menu, idx) => (
                      <div key={idx} className="flex items-center justify-between border-b border-border/40 pb-3 last:border-0 last:pb-0 group">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className={`
                            w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-sm
                            ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : 
                              idx === 1 ? 'bg-slate-200 text-slate-700' : 
                              idx === 2 ? 'bg-orange-100 text-orange-700' : 
                              'bg-muted text-muted-foreground'}
                          `}>
                            {idx + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{menu.name}</p>
                            <p className="text-[10px] text-muted-foreground">{formatIDR(menu.omzet)}</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold ml-2 whitespace-nowrap bg-muted/30 px-2 py-0.5 rounded">
                            {menu.qty} <span className="text-[10px] font-normal text-muted-foreground">pcs</span>
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}