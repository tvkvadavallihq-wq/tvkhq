import type { Metadata } from "next";
import type { ReactNode } from "react";
import { QueryProvider } from "@/components/providers/query-provider";
import { SiteShell } from "@/components/site-shell";
import { APP_NAME } from "@/lib/constants";
import { getSiteActive } from "@/lib/repositories/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: "Tamil-first grievance management platform for Vadavalli ward operations.",
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const siteActive = await getSiteActive();

  return (
    <html lang="ta">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <QueryProvider>
          <SiteShell siteActive={siteActive}>{children}</SiteShell>
        </QueryProvider>
      </body>
    </html>
  );
}
