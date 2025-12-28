import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-secondary flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Header Section */}
        <div className="space-y-3 pt-8">
          <div className="text-sm uppercase tracking-widest text-muted-foreground font-semibold">Angkringan</div>
          <h1 className="text-5xl font-bold text-foreground">Coklat Tepi Sawah</h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Pilih meja → pilih menu → bayar → nota digital.
          </p>
        </div>

        {/* CTA Button */}
        <div className="pt-4">
          <Link href="/pilih-meja" className="block">
            <Button
              size="lg"
              className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-shadow"
            >
              Mulai Pesan
            </Button>
          </Link>
        </div>

        {/* Footer Text */}
        <p className="text-xs text-muted-foreground tracking-wider">Fast • Simple • Brown vibes 🍫</p>
      </div>
    </main>
  )
}
