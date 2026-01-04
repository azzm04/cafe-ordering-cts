// src/components/ContinuePaymentButton.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  orderNumber: string;
};

type ApiResp =
  | { ok: true; status: string; redirectUrl: string | null }
  | { message: string; redirectUrl?: string | null };

function isApiOk(x: unknown): x is { ok: true; status: string; redirectUrl: string | null } {
  return typeof x === "object" && x !== null && "ok" in x;
}

export function ContinuePaymentButton({ orderNumber }: Props) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const openPayment = async () => {
    setLoading(true);
    setErr(null);

    try {
      const res = await fetch(`/api/orders/payment-link?orderNumber=${encodeURIComponent(orderNumber)}`, {
        method: "GET",
        cache: "no-store",
      });

      const json = (await res.json()) as unknown;

      if (!res.ok) {
        const msg =
          typeof json === "object" && json !== null && "message" in json
            ? String((json as Record<string, unknown>).message)
            : "Gagal ambil link pembayaran";
        throw new Error(msg);
      }

      if (!isApiOk(json) || !json.redirectUrl) {
        throw new Error("Link pembayaran belum tersedia. Coba refresh beberapa detik lagi.");
      }

      // ✅ Open tab baru (no popup snap)
      const w = window.open(json.redirectUrl, "_blank", "noopener,noreferrer");

      // Kalau diblokir browser, fallback redirect tab yang sama
      if (!w) {
        window.location.href = json.redirectUrl;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Button
        type="button"
        onClick={openPayment}
        className="w-full font-semibold h-11 text-base"
        disabled={loading}
      >
        💳 {loading ? "Membuka..." : "Lanjutkan Pembayaran"}
      </Button>

      {err ? <p className="mt-2 text-sm text-red-600">{err}</p> : null}

      <p className="mt-2 text-xs text-muted-foreground">
        Jika tab pembayaran tertutup, klik tombol ini untuk melanjutkan pembayaran.
      </p>
    </div>
  );
}
