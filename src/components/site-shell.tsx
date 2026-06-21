"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SiteLaunchingSoon } from "@/components/site-launching-soon";
import { SiteNav } from "@/components/site-nav";
import { APP_NAME, APP_NAME_TAMIL } from "@/lib/constants";

export function SiteShell({ children, siteActive }: { children: ReactNode; siteActive: boolean }) {
  const pathname = usePathname();
  const isAdminPath = pathname?.startsWith("/admin") ?? false;

  if (!siteActive && !isAdminPath) {
    return <SiteLaunchingSoon />;
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 overflow-hidden border-b border-[#f4d08a]/30 bg-gradient-to-r from-[#3b0000] via-[#7a0d0d] to-[#b51f13] text-white shadow-[0_8px_30px_rgba(91,0,0,0.22)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="min-w-0">
            <p className="text-xs font-semibold text-amber-200 sm:text-sm">{APP_NAME}</p>
            <p className="break-words text-base font-black leading-tight text-white sm:text-lg">{APP_NAME_TAMIL}</p>
          </Link>
          <SiteNav />
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
