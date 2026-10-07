import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { siteConfig } from "@/lib/site-config";
import { UtmTracker } from "@/components/UtmTracker";
import { Suspense } from "react";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: `${siteConfig.name} - Nền tảng Tài liệu THPT Quốc Gia`,
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body
        className={`${nunito.variable} font-sans antialiased min-h-screen flex flex-col overflow-x-hidden`}
      >
        <ThemeProvider>
          <Suspense fallback={null}>
            <UtmTracker />
          </Suspense>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
