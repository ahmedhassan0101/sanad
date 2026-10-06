import type { Metadata } from "next";
import { Inter, Tajawal } from "next/font/google";
import { DirectionProvider } from "@/components/ui/direction";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

// اللاتينية بـ Inter والعربية تسقط تلقائيًا على Tajawal (لا حروف عربية في Inter).
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-tajawal",
  display: "swap",
});

export const metadata: Metadata = {
  title: "سند | Sanad",
  description: "Sanad — mosque and Quran center management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className={`${inter.variable} ${tajawal.variable}`}>
      <body>
        <ThemeProvider>
          <DirectionProvider direction="rtl">{children}</DirectionProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
