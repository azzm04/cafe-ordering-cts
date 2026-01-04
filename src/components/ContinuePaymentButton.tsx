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

      // ✅ FIX: Langsung redirect di tab yang sama.
      // Ini mencegah terbukanya 2 tab (popup + redirect) secara bersamaan.
      // User akan diarahkan ke Midtrans, lalu nanti balik lagi ke halaman nota setelah bayar.
      window.location.href = json.redirectUrl;

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setErr(msg);
      setLoading(false); // Matikan loading kalau error, biar bisa klik lagi
    }
  };

  return (
    <div className="w-full">
      <Button
        type="button"
        onClick={openPayment}
        // Saya ganti warna jadi Emerald/Hijau agar beda dengan tombol "Pesan Lagi" (Opsional)
        className="w-full font-semibold h-12 text-base shadow-md bg-emerald-700 hover:bg-emerald-800 text-white"
        disabled={loading}
      >
        {/* Tambah ikon kartu agar lebih intuitif */}
        <span className="mr-2">💳</span> 
        {loading ? "Memproses..." : "Lanjutkan Pembayaran"}
      </Button>

      {err ? <p className="mt-2 text-sm text-red-600 text-center">{err}</p> : null}
      
      {/* Teks bantuan di bawah dihapus atau disederhanakan karena sekarang sistemnya redirect, bukan popup */}
    </div>
  );
}