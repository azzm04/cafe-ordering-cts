// src/components/PrintAuto.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  autoClose?: boolean;
  delay?: number;
  showManualButton?: boolean;
};

export function PrintAuto({ 
  autoClose = false, 
  delay = 300,
  showManualButton = true 
}: Props) {
  const hasPrinted = useRef(false);
  const [printError, setPrintError] = useState(false);

  const handlePrint = () => {
    try {
      window.print();
      
      if (autoClose) {
        setTimeout(() => {
          window.close();
        }, 500);
      }
    } catch (error) {
      console.error("Print error:", error);
      setPrintError(true);
    }
  };

  useEffect(() => {
    if (!hasPrinted.current) {
      hasPrinted.current = true;
      
      const timer = setTimeout(() => {
        handlePrint();
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [delay, autoClose]);

  // Show manual button if auto-print failed or user needs to re-print
  if (!showManualButton && !printError) return null;

  return (
    <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
      <Button 
        onClick={handlePrint}
        variant="default"
        size="sm"
        className="bg-blue-600 hover:bg-blue-700"
      >
        🖨️ Print Ulang
      </Button>
      <Button 
        onClick={() => window.close()}
        variant="outline"
        size="sm"
      >
        ✕ Tutup
      </Button>
    </div>
  );
}