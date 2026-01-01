import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-secondary/10 rounded-full -mr-32 md:-mr-48 -mt-32 md:-mt-48 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-56 h-56 md:w-80 md:h-80 bg-accent/5 rounded-full -ml-28 md:-ml-40 -mb-28 md:-mb-40 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="max-w-2xl w-full text-center space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8">
          {/* Brand Label */}
          <div className="inline-flex items-center justify-center">
            <div className="text-xs md:text-sm uppercase tracking-[0.15em] font-semibold text-secondary px-3 sm:px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20">
              ☕ Angkringan
            </div>
          </div>

          <div className="space-y-2 sm:space-y-3 md:space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
              Coklat Tepi Sawah
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto px-1 sm:px-0">
              Cita rasa otentik, pengalaman santai. Pesan minuman favorit Anda dengan cara yang mudah dan cepat.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 py-4 sm:py-6 text-xs sm:text-sm text-muted-foreground">
            <span>Pilih meja</span>
            <span className="hidden sm:inline text-muted-foreground/50">→</span>
            <span>Pilih menu</span>
            <span className="hidden sm:inline text-muted-foreground/50">→</span>
            <span>Bayar</span>
            <span className="hidden sm:inline text-muted-foreground/50">→</span>
            <span>Nota digital</span>
          </div>

          {/* CTA Button */}
          <div className="pt-2 sm:pt-4">
            <Link href="/pilih-meja" className="inline-block w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-10 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                Mulai Pesan
              </Button>
            </Link>
          </div>

          {/* <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-6 sm:pt-8">
            <div className="flex flex-col items-center gap-1.5 sm:gap-2">
              <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                <span className="text-base sm:text-lg">⚡</span>
              </div>
              <span className="text-xs sm:text-sm font-medium text-muted-foreground text-center">Cepat</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 sm:gap-2">
              <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                <span className="text-base sm:text-lg">✨</span>
              </div>
              <span className="text-xs sm:text-sm font-medium text-muted-foreground text-center">Mudah</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 sm:gap-2">
              <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                <span className="text-base sm:text-lg">🍫</span>
              </div>
              <span className="text-xs sm:text-sm font-medium text-muted-foreground text-center">Nikmat</span>
            </div>
          </div> */}
        </div>

        <p className="absolute bottom-4 sm:bottom-6 md:bottom-8 text-xs px-4 text-center text-muted-foreground tracking-wider">
          Brown vibes only ✕ Lokal sejati ✕ Kualitas terjamin
        </p>
      </div>
    </main>
  )
}
