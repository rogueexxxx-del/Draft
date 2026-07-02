import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Draft",
  description: "A focus centered creative tool",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col relative">
        {/* Global Analog Grain Overlay Layer */}
        <div className="grain-overlay no-print" />

        {children}
      </body>
    </html>
  );
}

