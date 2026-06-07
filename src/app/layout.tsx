import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { QueryProvider } from "@/components/providers/query-provider";
import { APP_NAME, APP_NAME_TAMIL, NAV_ITEMS } from "@/lib/constants";
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
      <body className="min-h-screen antialiased">
        <QueryProvider>
          <div className="min-h-screen">
            <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
              <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <Link href="/" className="min-w-0">
                  <p className="text-sm font-semibold text-primary">{APP_NAME}</p>
                  <p className="truncate text-lg font-bold">{APP_NAME_TAMIL}</p>
                </Link>
                <nav className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
                  {NAV_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </header>
            <main>{children}</main>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
