"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Pause, Play, RefreshCw } from "lucide-react";

interface DashboardAutoRefreshProps {
  intervalMs: number;
  enabled: boolean;
  onRefresh: () => void;
}

export function DashboardAutoRefresh({
  intervalMs,
  enabled: initialEnabled,
  onRefresh,
}: DashboardAutoRefreshProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [countdown, setCountdown] = useState(Math.floor(intervalMs / 1000));
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const doRefresh = useCallback(() => {
    onRefresh();
    setLastRefresh(new Date());
    setCountdown(Math.floor(intervalMs / 1000));
  }, [onRefresh, intervalMs]);

  useEffect(() => {
    if (enabled) {
      intervalRef.current = setInterval(doRefresh, intervalMs);
      countdownRef.current = setInterval(() => {
        setCountdown((prev) =>
          prev > 0 ? prev - 1 : Math.floor(intervalMs / 1000),
        );
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [enabled, intervalMs, doRefresh]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
      <div className="flex items-center gap-3">
        <div className={`relative flex items-center justify-center w-3 h-3`}>
          <span
            className={`absolute inline-flex h-full w-full rounded-full ${enabled ? "bg-emerald-400 animate-ping" : "bg-gray-400"} opacity-75`}
          ></span>
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${enabled ? "bg-emerald-500" : "bg-gray-500"}`}
          ></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            {enabled ? "Auto refresh aktif" : "Auto refresh nonaktif"}
          </span>
          <span className="text-xs text-muted-foreground">
            • Cek terakhir {formatTime(lastRefresh)}
          </span>
          {enabled && (
            <Badge variant="secondary" className="text-xs font-mono">
              <RefreshCw className="w-3 h-3 mr-1" />
              {countdown}s
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEnabled(!enabled)}
          className={`text-xs ${enabled ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50" : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"}`}
        >
          {enabled ? (
            <>
              <Pause className="w-3 h-3 mr-1" />
              Jeda
            </>
          ) : (
            <>
              <Play className="w-3 h-3 mr-1" />
              Aktifkan
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEnabled(false)}
          className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
          disabled={!enabled}
        >
          <Activity className="w-3 h-3 mr-1" />
          Matikan
        </Button>
      </div>
    </div>
  );
}
