import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Halaqa",
  description: "Multi-center management platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
