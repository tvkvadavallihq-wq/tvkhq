"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useIntervalCarousel } from "@/hooks/use-interval-carousel";
import { Button } from "@/components/ui/button";
import type { HomepageBanner } from "@/lib/repositories/public";

export function BannersCarousel({ banners }: { banners: HomepageBanner[] }) {
  const { index, setIndex } = useIntervalCarousel(banners.length, 6000);
  const active = banners[index];

  if (banners.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
      <div className="relative">
        <div className="relative aspect-[16/9] min-h-[260px] overflow-hidden bg-gradient-to-br from-amber-50 via-background to-stone-100 sm:min-h-[340px]">
          {active.image_path ? (
            <Image src={active.image_path} alt={active.title_ta} fill sizes="(max-width: 1024px) 100vw, 55vw" className="object-contain p-2 sm:p-4" />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-6 text-center text-lg font-bold text-primary">
              {active.title_ta}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4 border-t bg-card px-4 py-4 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Featured Banner</p>
              <p className="truncate text-sm font-semibold text-foreground">{active.title_ta}</p>
            </div>
            {active.link_url ? (
              <Button asChild size="sm" variant="outline" className="shrink-0">
                <a href={active.link_url} target="_blank" rel="noreferrer">
                  Open Banner
                </a>
              </Button>
            ) : null}
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Carousel</p>
            {banners.length > 1 ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="size-9 px-0"
                  onClick={() => setIndex((index - 1 + banners.length) % banners.length)}
                  aria-label="Previous banner"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <div className="flex items-center gap-1.5 rounded-full border bg-background px-2 py-1">
                  {banners.map((banner, bannerIndex) => (
                    <button
                      key={banner.id}
                      type="button"
                      className={`h-2.5 rounded-full transition-all ${bannerIndex === index ? "w-7 bg-primary" : "w-2.5 bg-muted-foreground/30"}`}
                      aria-label={`Show banner ${bannerIndex + 1}`}
                      onClick={() => setIndex(bannerIndex)}
                    />
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="size-9 px-0"
                  onClick={() => setIndex((index + 1) % banners.length)}
                  aria-label="Next banner"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
