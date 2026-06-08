"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="grid w-full min-w-0 grid-cols-2 gap-2 sm:flex sm:w-auto sm:gap-2">
      {NAV_ITEMS.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "min-w-0 w-full justify-center rounded-full border px-2 py-2 text-center text-[11px] font-medium leading-tight transition sm:w-auto sm:px-3 sm:text-sm",
              active
                ? "border-amber-200/70 bg-amber-200 text-[#6b0f0f] shadow-sm"
                : "border-white/15 bg-white/10 text-white/95 hover:bg-white/18 hover:text-white",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
