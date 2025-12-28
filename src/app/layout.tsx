import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata = {
  title: "Coklat Tepi Sawah",
  description: "Web Ordering System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-background text-foreground">
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}
