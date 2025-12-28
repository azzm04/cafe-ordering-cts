import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center p-6 text-center">
      <div className="space-y-3">
        <div className="text-xs uppercase tracking-widest opacity-70">Angkringan</div>
        <h1 className="text-3xl font-bold">Coklat Tepi Sawah</h1>
        <p className="text-sm opacity-80">
          Pilih meja → pilih menu → bayar → nota digital.
        </p>
      </div>

      <div className="mt-8 w-full">
        <Link href="/pilih-meja">
          <Button className="w-full">Mulai Pesan</Button>
        </Link>
      </div>

      <p className="mt-6 text-xs opacity-60">Fast • Simple • Brown vibes 🍫</p>
    </main>
  );
}
