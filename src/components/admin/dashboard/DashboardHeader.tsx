"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  RefreshCcw,
  LogOut,
  History, PlusCircle 
} from "lucide-react";

export function DashboardHeader({
  title,
  onRefresh,
  loading,
  rightSlot,
  showManualOrder = false,
}: {
  title: string;
  onRefresh: () => void;
  loading: boolean;
  rightSlot?: React.ReactNode;
  showManualOrder?: boolean;
}) {
  return (
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-6 border-b border-border/40">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
        {showManualOrder && (
          <Link href="/admin/manual-order">
            <Button 
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-md hover:shadow-lg transition-all duration-200"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Manual Order
            </Button>
          </Link>
        )}
        <Button
          variant="secondary"
          onClick={onRefresh}
          disabled={loading}
          className="flex-1 sm:flex-none h-10 shadow-sm border border-border/50 bg-background hover:bg-muted transition-all"
        >
          <RefreshCcw
            className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          {loading ? "Memuat..." : "Refresh"}
        </Button>

        {rightSlot}

        <div className="h-8 w-px bg-border/60 mx-1 hidden sm:block" />

        <Link href="/admin/history" className="flex-1 sm:flex-none">
          <Button
            variant="outline"
            className="w-full h-10 border-border/60 hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all"
          >
            <History className="w-4 h-4 mr-2" />
            Riwayat
          </Button>
        </Link>

        <Button
          variant="ghost"
          onClick={() => {
            document.cookie =
              "cts_admin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            location.href = "/admin/login";
          }}
          className="flex-1 sm:flex-none h-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Keluar
        </Button>
      </div>
    </div>
  );
}
