import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from '@/components/ui/Toast';

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
      <head>
        <link
          rel="preload"
          href="/fonts/Redaction-Regular.otf"
          as="font"
          type="font/otf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/Redaction35-Regular.otf"
          as="font"
          type="font/otf"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full flex flex-col relative">
        {/* Global Analog Grain Overlay Layer */}
        <div className="grain-overlay no-print" />

        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

