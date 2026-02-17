import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "S.L.I.P.R. Revenue Leak Scanner",
  description: "Diagnose operational gaps and revenue leaks in service businesses",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f8f9fa]">{children}</body>
    </html>
  );
}
