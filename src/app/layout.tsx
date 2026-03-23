import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Circa Panama - Presentation Builder",
  description: "Build professional property presentations for Circa Panama clients",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="ambient-glow" />
        {children}
      </body>
    </html>
  );
}
