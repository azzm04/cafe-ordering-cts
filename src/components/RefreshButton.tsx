"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function RefreshButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full font-semibold h-11 text-base"
      disabled={loading}
      onClick={() => {
        setLoading(true);
        router.refresh();
        window.setTimeout(() => setLoading(false), 600);
      }}
    >
      {loading ? "Merefresh..." : "Refresh Status"}
    </Button>
  );
}
