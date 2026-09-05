import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { ThemeProvider } from "@/components/dashboard/theme-provider";

export const metadata: Metadata = {
  title: "Steel Data Hub — Steel Specification & Material Database",
  description: "Tra cứu, phân biệt và quản lý các loại thép, mã thép, quy cách thép.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
