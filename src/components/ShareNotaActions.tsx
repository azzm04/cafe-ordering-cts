// src/components/ShareNotaActions.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"; 
import { Share2, Check, AlertCircle } from "lucide-react"; // ✅ Tambah AlertCircle

type Props = {
  orderNumber: string;
  tableNumber: number | null;
  totalAmount: number;
};

export function ShareNotaActions({ orderNumber, tableNumber }: Props) {
  const [copied, setCopied] = useState(false);
  
  const [state, setState] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleShare = async () => {
    // Reset state pesan sebelum memulai aksi
    setState(null);

    const url = window.location.href;
    const title = `Nota Makan - Meja ${tableNumber ?? "-"}`;
    const text = `Ini nota digital makan kita tadi (Order: ${orderNumber}).`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link nota berhasil disalin!");
      
      setState({ type: "success", message: "Link berhasil disalin!" });

      setTimeout(() => {
        setCopied(false);
        setState(null); // Hilangkan pesan setelah 3 detik
      }, 3000);
    } catch {
      toast.error("Gagal menyalin link");
      setState({ type: "error", message: "Gagal menyalin link browser." });
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Tombol Utama */}
      <Button
        variant="outline"
        className="w-full h-12 text-base font-semibold border-primary/20 text-primary hover:bg-primary/5 hover:text-primary"
        onClick={handleShare}
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 mr-2" />
            Link Disalin
          </>
        ) : (
          <>
            <Share2 className="w-4 h-4 mr-2" />
            Bagikan Nota
          </>
        )}
      </Button>

      <div className="flex gap-3 p-4 rounded-lg bg-secondary/10 border border-secondary/20">
        <AlertCircle className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Simpan link ini untuk melihat status pesanan kapan saja
        </p>
      </div>

      {state && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium transition-all animate-in fade-in slide-in-from-top-1 ${
            state.type === "error"
              ? "bg-red-50 border border-red-200 text-red-700"
              : "bg-emerald-50 border border-emerald-200 text-emerald-700"
          }`}
        >
          {state.type === "success" ? (
            <Check className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{state.message}</span>
        </div>
      )}
    </div>
  );
}