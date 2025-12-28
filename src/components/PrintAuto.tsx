"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export function PrintAuto() {
  useEffect(() => {
    // kasih sedikit delay supaya layout kebentuk dulu
    const t = window.setTimeout(() => window.print(), 300);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="no-print fixed bottom-4 right-4 flex gap-2">
      <Button variant="secondary" onClick={() => window.print()}>
        Print Lagi
      </Button>
      <Button onClick={() => window.close()}>Tutup</Button>
    </div>
  );
}
