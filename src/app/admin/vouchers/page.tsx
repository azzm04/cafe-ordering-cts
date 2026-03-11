// src/app/admin/vouchers/page.tsx

import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import VoucherManager from "@/components/admin/dashboard/VoucherManager";
import BackgroundDecorations from "@/components/shared/BackgroundDecorations";
import { requireAdmin } from "@/lib/admin-auth-server"; 
import { NextResponse } from "next/server";

export default async function VoucherPage() {
  const auth = await requireAdmin();

  if (!auth || auth instanceof NextResponse) {
    redirect("/admin/login");
  }

  if (auth.role !== "owner") {
    redirect("/admin/dashboard");
  }

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden">
      <BackgroundDecorations />
      <div className="relative z-10 mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
        
        <div className="flex items-center gap-2 mb-8">
          <Link href="/admin/owner"> 
            <Button variant="ghost" size="icon" className="rounded-full">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Kelola Voucher & Promo</h1>
            <p className="text-muted-foreground">Buat kode diskon untuk menarik pelanggan</p>
          </div>
        </div>

        <VoucherManager />
        
      </div>
    </main>
  );
}