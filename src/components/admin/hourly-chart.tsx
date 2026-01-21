"use client";

import { useMemo, useState } from "react";

type HourlyChartProps = {
  data: number[];
  title?: string;
};

export function HourlyChart({ data }: HourlyChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const chartData = useMemo(() => {
    const rawMax = Math.max(...data);
    const maxVal = rawMax === 0 ? 10 : rawMax; 
    const total = data.reduce((a, b) => a + b, 0);
    const isEmpty = total === 0;

    const width = 600; 
    const height = 200; 
    
    const padding = { top: 20, right: 10, bottom: 30, left: 10 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const points = data.map((val, idx) => {
      const x = padding.left + (idx / (data.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - (val / maxVal) * chartHeight;
      return { x, y, val, hour: idx };
    });

    // Membuat Kurva Bezier yang Smooth
    let pathD = "";
    if (points.length > 0 && !isEmpty) {
      pathD = `M ${points[0].x} ${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(0, i - 1)];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[Math.min(points.length - 1, i + 2)];

        const tension = 0.3; 
        
        const cp1x = p1.x + (p2.x - p0.x) * tension;
        const cp1y = p1.y + (p2.y - p0.y) * tension;
        const cp2x = p2.x - (p3.x - p1.x) * tension;
        const cp2y = p2.y - (p3.y - p1.y) * tension;

        pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
      }
    }

    // Area di bawah grafik (untuk gradient fill)
    const areaPath = pathD
      ? `${pathD} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`
      : "";

    return { maxVal, total, isEmpty, points, pathD, areaPath, width, height, padding, chartHeight, chartWidth };
  }, [data]);

  const { total, isEmpty, points, pathD, areaPath, width, height, padding, chartHeight, chartWidth } = chartData;
  const baselineY = padding.top + chartHeight;
  
  const xLabels = [0, 6, 12, 18, 23];

  // EMPTY STATE
  if (isEmpty) {
    return (
      <div className="w-full h-50 flex flex-col items-center justify-center bg-muted/20 rounded-xl border border-dashed border-border/60">
        <div className="p-3 bg-muted rounded-full mb-2">
           <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
        </div>
        <p className="text-2xl font-bold text-muted-foreground/50 font-sans">0</p>
        <p className="text-sm text-muted-foreground font-sans">Belum ada transaksi</p>
      </div>
    );
  }

  return (
    <div className="w-full font-sans">
      {/* Container Grafik Responsif */}
      <div className="relative w-full h-50 group">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            {/* Gradient Fill: Menggunakan CSS Variables Primary */}
            <linearGradient id="areaGradientPrimary" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.2} />
              <stop offset="90%" stopColor="var(--color-primary)" stopOpacity={0} />
            </linearGradient>
            
            {/* Gradient Stroke Line */}
            <linearGradient id="lineGradientPrimary" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--color-primary)" />
              <stop offset="100%" stopColor="var(--color-accent)" />
            </linearGradient>
          </defs>

          {/* Grid Lines Horizontal */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <line
              key={i}
              x1={padding.left}
              y1={padding.top + chartHeight * (1 - ratio)}
              x2={width - padding.right}
              y2={padding.top + chartHeight * (1 - ratio)}
              stroke="var(--color-border)"
              strokeWidth={1}
              strokeDasharray={ratio === 0 ? "0" : "4 4"}
              strokeOpacity={0.6}
            />
          ))}

          {/* Area Fill */}
          <path d={areaPath} fill="url(#areaGradientPrimary)" />

          {/* Main Line Curve */}
          <path 
            d={pathD} 
            fill="none" 
            stroke="url(#lineGradientPrimary)" 
            strokeWidth={3} 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="drop-shadow-sm"
          />

          {/* Interactive Transparent Bars (Hitbox lebih besar) */}
          {points.map((point, idx) => (
            <rect
              key={idx}
              x={point.x - (width / points.length) / 2}
              y={padding.top}
              width={width / points.length}
              height={chartHeight}
              fill="transparent"
              onMouseEnter={() => setHoveredIndex(idx)}
              className="cursor-pointer"
            />
          ))}

          {hoveredIndex !== null && points[hoveredIndex] && (
            <>
              <line 
                x1={points[hoveredIndex].x} 
                y1={padding.top} 
                x2={points[hoveredIndex].x} 
                y2={baselineY} 
                stroke="var(--color-primary)" 
                strokeWidth={1.5} 
                strokeDasharray="4 4" 
                strokeOpacity={0.5} 
              />
              
              <circle 
                cx={points[hoveredIndex].x} 
                cy={points[hoveredIndex].y} 
                r={8} 
                fill="var(--color-primary)" 
                fillOpacity={0.2} 
                className="animate-pulse"
              />
              <circle 
                cx={points[hoveredIndex].x} 
                cy={points[hoveredIndex].y} 
                r={4} 
                fill="var(--color-background)" 
                stroke="var(--color-primary)" 
                strokeWidth={2} 
              />
            </>
          )}

          {xLabels.map((hour) => {
             const xPos = padding.left + (hour / 23) * chartWidth;
             return (
                <text 
                  key={hour} 
                  x={xPos} 
                  y={height - 5} 
                  textAnchor="middle" 
                  fill="var(--color-muted-foreground)" 
                  style={{ fontSize: "11px", fontWeight: 500 }}
                  className="font-sans"
                >
                  {String(hour).padStart(2, "0")}:00
                </text>
             )
          })}
        </svg>

        {hoveredIndex !== null && points[hoveredIndex] && (
          <div
            className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-[120%] transition-all duration-75 ease-out"
            style={{ 
              left: `${(points[hoveredIndex].x / width) * 100}%`, 
              top: `${((points[hoveredIndex].y) / height) * 100}%`, 
            }}
          >
            <div className="bg-popover text-popover-foreground border border-border shadow-lg rounded-lg px-3 py-2 flex flex-col items-center min-w-[80px]">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">
                    Jam {String(hoveredIndex).padStart(2, "0")}:00
                </span>
                <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-primary font-mono leading-none">
                        {points[hoveredIndex].val}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">trx</span>
                </div>
            </div>
            <div className="w-2 h-2 bg-popover border-r border-b border-border rotate-45 absolute bottom-[-5px] left-1/2 -translate-x-1/2"></div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-2 border-t border-border/40 pt-2">
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <p className="text-xs text-muted-foreground font-medium">Aktivitas 24 Jam</p>
         </div>
         <p className="text-xs text-muted-foreground font-sans">
            Total: <strong className="text-primary font-bold">{total}</strong> transaksi
         </p>
      </div>
    </div>
  );
}