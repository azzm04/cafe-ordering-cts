// src/components/admin/DashboardAutoRefresh.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type Props = {
  intervalMs?: number;
  enabled?: boolean;
  onRefresh: () => void | Promise<void>;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatTimeHHmmss(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

export function DashboardAutoRefresh({
  intervalMs = 5000,
  enabled = true,
  onRefresh,
}: Props) {
  const [lastCheck, setLastCheck] = useState<string>(() =>
    formatTimeHHmmss(new Date())
  );
  
  const [isStopped, setIsStopped] = useState(!enabled);
  const [isPaused, setIsPaused] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = useCallback(async () => {
    if (isStopped || isPaused || isRefreshing) return;

    try {
      setIsRefreshing(true);
      await onRefresh();
      setLastCheck(formatTimeHHmmss(new Date()));
    } catch (error) {
      console.error("Auto refresh error:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh, isStopped, isPaused, isRefreshing]);

  useEffect(() => {
    if (isStopped || isPaused) return;

    const intervalId = setInterval(() => {
      if (!isStopped && !isPaused && !isRefreshing) {
        void refreshData();
      }
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [intervalMs, refreshData, isStopped, isPaused, isRefreshing]);

  const togglePause = () => {
    setIsPaused((prev) => !prev);
  };

  const stop = () => {
    setIsStopped(true);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="text-xs text-muted-foreground flex items-center gap-2">
        <span
          className={`inline-block w-2 h-2 rounded-full transition-colors duration-300 ${
            isStopped 
              ? "bg-muted-foreground/40" 
              : isPaused 
              ? "bg-amber-500" 
              : isRefreshing
              ? "bg-blue-500 animate-pulse"
              : "bg-emerald-500 animate-pulse"
          }`}
        />
        <span>
          {isStopped 
            ? "Auto refresh dimatikan" 
            : isPaused 
            ? "Auto refresh dijeda" 
            : isRefreshing
            ? "Memuat data..."
            : "Auto refresh aktif"} · Cek terakhir {lastCheck}
        </span>
      </div>

      {!isStopped && (
        <button
          onClick={togglePause}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
        >
          {isPaused ? "Lanjutkan" : "Jeda"}
        </button>
      )}

      {!isStopped && (
        <button
          onClick={stop}
          className="text-xs text-destructive hover:text-destructive/80 transition-colors underline"
        >
          Matikan
        </button>
      )}
    </div>
  );
}