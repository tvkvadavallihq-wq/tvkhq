import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { QueryProvider } from "@/components/providers/query-provider";
import { SiteNav } from "@/components/site-nav";
import { APP_NAME, APP_NAME_TAMIL } from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: "Tamil-first grievance management platform for Vadavalli ward operations.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ta">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <QueryProvider>
          <div className="min-h-screen">
            <header className="sticky top-0 z-40 border-b border-[#f4d08a]/30 bg-gradient-to-r from-[#3b0000] via-[#7a0d0d] to-[#b51f13] text-white shadow-[0_8px_30px_rgba(91,0,0,0.22)] backdrop-blur">
              <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <Link href="/" className="min-w-0">
                  <p className="text-sm font-semibold text-amber-200">{APP_NAME}</p>
                  <p className="truncate text-lg font-black text-white">{APP_NAME_TAMIL}</p>
                </Link>
                <SiteNav />
              </div>
            </header>
            <main>{children}</main>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
