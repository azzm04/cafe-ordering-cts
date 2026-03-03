"use client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LayoutGrid, Armchair, Users } from "lucide-react";
import { Table } from "@/types/index"; // Gunakan import pusat


export function TablesCard({ tables }: { tables: Table[] }) {
  // Update filter ke Bahasa Indonesia
  const availableCount = tables.filter((t) => t.status === "tersedia").length;
  const occupiedCount = tables.filter((t) => t.status === "terisi").length;

  const getStatusBadgeVariant = (status: Table["status"]) => {
    switch (status) {
      case "tersedia":
        return "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200";
      case "terisi":
        return "bg-red-100 text-red-700 hover:bg-red-200 border-red-200";
      case "dipesan":
        return "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusText = (status: Table["status"]) => {
    switch (status) {
      case "tersedia":
        return "Kosong";
      case "terisi":
        return "Terisi";
      case "dipesan":
        return "Reserved"; // Atau "Dipesan"
      default:
        return status;
    }
  };

  const getCardStyle = (status: Table["status"]) => {
    switch (status) {
      case "tersedia":
        return "bg-card border-border/60 hover:border-emerald-400 hover:shadow-[0_4px_20px_-10px_rgba(16,185,129,0.3)] hover:-translate-y-1";
      case "terisi":
        return "bg-red-50/40 border-red-200 hover:border-red-400 hover:shadow-[0_4px_20px_-10px_rgba(239,68,68,0.3)] hover:-translate-y-1";
      case "dipesan":
        return "bg-blue-50/40 border-blue-200 hover:border-blue-400 hover:shadow-[0_4px_20px_-10px_rgba(59,130,246,0.3)] hover:-translate-y-1";
      default:
        return "bg-muted";
    }
  };

  const getIconColor = (status: Table["status"]) => {
    switch (status) {
      case "tersedia":
        return "text-emerald-500 bg-emerald-100";
      case "terisi":
        return "text-red-500 bg-red-100";
      case "dipesan":
        return "text-blue-500 bg-blue-100";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  return (
    <Card className="overflow-hidden border-none shadow-md bg-white/50 backdrop-blur-sm dark:bg-card/40 ring-1 ring-border/50 rounded-2xl transition-all">
      {/* Header */}
      <div className="p-6 border-b border-border/40 bg-muted/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Status Meja</h2>
              <p className="text-xs text-muted-foreground">
                Overview ketersediaan meja restoran
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-700 border-emerald-200 h-7 px-3"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
              {availableCount} Kosong
            </Badge>
            <Badge
              variant="outline"
              className="bg-red-50 text-red-700 border-red-200 h-7 px-3"
            >
              <Users className="w-3.5 h-3.5 mr-1.5" />
              {occupiedCount} Terisi
            </Badge>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {tables.map((table) => (
            <div
              key={table.id}
              className={`
                relative p-4 rounded-xl border transition-all duration-300 group flex flex-col items-center justify-between gap-3 min-h-[120px]
                ${getCardStyle(table.status)}
              `}
            >
              {/* Header Card: Icon & Status Dot */}
              <div className="w-full flex justify-between items-start">
                <div
                  className={`p-1.5 rounded-lg ${getIconColor(table.status)} transition-colors`}
                >
                  <Armchair className="w-4 h-4" />
                </div>
                <div
                  className={`w-2 h-2 rounded-full ${table.status === "tersedia" ? "bg-emerald-500" : table.status === "terisi" ? "bg-red-500" : "bg-blue-500"}`}
                />
              </div>

              {/* Body: Table Number */}
              <div className="text-center">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Meja
                </span>
                <p className="text-3xl font-black text-foreground tabular-nums leading-none mt-1">
                  {table.table_number}
                </p>
              </div>

              {/* Footer: Badge */}
              <Badge
                variant="outline"
                className={`w-full justify-center text-[10px] font-bold border-0 h-6 ${getStatusBadgeVariant(table.status)}`}
              >
                {getStatusText(table.status)}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
