"use client";

import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

interface Props {
  step: "table" | "menu" | "confirm";
  setStep: (step: "table" | "menu" | "confirm") => void;
  hasTable: boolean;
  hasCart: boolean;
}

export function StepIndicator({ step, setStep, hasTable, hasCart }: Props) {
  return (
    <div className="hidden sm:flex items-center gap-2">
      {/* STEP 1: TABLE */}
      <Badge
        variant={step === "table" ? "default" : "secondary"}
        className={`cursor-pointer transition-all ${
          step === "table" ? "bg-amber-700 hover:bg-amber-800" : "hover:bg-amber-100"
        }`}
        onClick={() => setStep("table")}
      >
        1. Pilih Meja
      </Badge>

      <ArrowRight className="w-4 h-4 text-muted-foreground" />

      {/* STEP 2: MENU */}
      <Badge
        variant={step === "menu" ? "default" : "secondary"}
        className={`cursor-pointer transition-all ${
          step === "menu"
            ? "bg-amber-700 hover:bg-amber-800"
            : hasTable
            ? "hover:bg-amber-100"
            : "opacity-50 cursor-not-allowed"
        }`}
        onClick={() => hasTable && setStep("menu")}
      >
        2. Pilih Menu
      </Badge>

      <ArrowRight className="w-4 h-4 text-muted-foreground" />

      {/* STEP 3: CONFIRM */}
      <Badge
        variant={step === "confirm" ? "default" : "secondary"}
        className={`cursor-pointer transition-all ${
          step === "confirm"
            ? "bg-amber-700 hover:bg-amber-800"
            : hasCart
            ? "hover:bg-amber-100"
            : "opacity-50 cursor-not-allowed"
        }`}
        onClick={() => hasCart && setStep("confirm")}
      >
        3. Konfirmasi
      </Badge>
    </div>
  );
}