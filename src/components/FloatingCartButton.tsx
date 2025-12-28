"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cartStore";

export function FloatingCartButton() {
  const count = useCartStore((s) => s.getItemCount());
  if (count <= 0) return null;

  return (
    <div className="fixed bottom-5 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-6">
      <Link href="/keranjang">
        <Button className="w-full shadow-lg">
          Buka Keranjang ({count})
        </Button>
      </Link>
    </div>
  );
}
