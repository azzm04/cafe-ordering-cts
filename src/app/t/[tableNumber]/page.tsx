"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";

function parseTableNumber(value: string): number | null {
  const n = Number(value);
  if (!Number.isInteger(n)) return null;
  if (n < 1 || n > 99) return null; // batas bebas, bisa kamu ubah 1..10
  return n;
}

export default function TableRedirectPage() {
  const router = useRouter();
  const params = useParams<{ tableNumber: string }>();
  const setTableNumber = useCartStore((s) => s.setTableNumber);

  useEffect(() => {
    const raw = params.tableNumber;
    const n = parseTableNumber(raw);

    if (!n) {
      router.replace("/pilih-meja"); // fallback kalau QR salah
      return;
    }

    setTableNumber(n);
    router.replace("/menu");
  }, [params.tableNumber, router, setTableNumber]);

  return (
    <main className="mx-auto min-h-screen max-w-md p-6">
      <p className="text-sm opacity-80">Mengatur nomor meja...</p>
    </main>
  );
}
