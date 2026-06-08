import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BadgeInfo, FilePlus2, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HomepageStats } from "@/lib/repositories/public";

export function HeroSection({
  heroBannerSrc,
  stats,
}: {
  heroBannerSrc: string;
  stats: HomepageStats;
}) {
  return (
    <section className="border-b border-border/60 bg-background">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:py-12">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-primary">
            <span className="h-2 w-2 rounded-full bg-primary" />
            TVK Vadavalli HQ
          </div>

          <div className="overflow-hidden rounded-3xl border bg-gradient-to-br from-amber-50 via-background to-stone-100 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b bg-background/80 px-4 py-3 backdrop-blur">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Featured Banner</p>
                <p className="text-sm font-semibold text-foreground">TVK Vadavalli HQ public banner</p>
              </div>
            </div>
            <div className="relative aspect-[16/9] min-h-[260px] overflow-hidden sm:min-h-[360px]">
              {heroBannerSrc ? (
                <Image src={heroBannerSrc} alt="TVK Vadavalli HQ banner" fill priority sizes="(max-width: 1024px) 100vw, 55vw" className="object-contain p-2 sm:p-4" />
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-3xl border bg-background p-5 shadow-sm sm:p-6">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent" />
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-primary">
                <Sparkles className="size-3.5" />
                மக்கள் சேவை தளம்
              </div>
              <h1 className="text-3xl font-black leading-tight text-foreground sm:text-5xl">
                வடவள்ளிக்கான புகார் தீர்வு, வார்டு தகவல் மற்றும் சேவைப் புதுப்பிப்புகள்
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                புகார்களை பதிவு செய்யவும், நிலையை அறியவும், உங்கள் வார்டு தொடர்பாளர்களை உடனே கண்டுபிடிக்கவும். நேரடி தரவுடன் இயங்கும் பொதுத் தளம்.
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                <Button asChild size="lg" className="justify-between">
                  <Link href="/complaint/new">
                    <span className="inline-flex items-center gap-2">
                      <FilePlus2 className="size-5" />
                      Register Complaint
                    </span>
                    <ArrowRight className="size-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="justify-between">
                  <Link href="/track">
                    <span className="inline-flex items-center gap-2">
                      <Search className="size-5" />
                      Track Complaint
                    </span>
                    <ArrowRight className="size-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary" className="justify-between">
                  <Link href="/complaints">
                    <span className="inline-flex items-center gap-2">
                      <BadgeInfo className="size-5" />
                      View Complaints
                    </span>
                    <ArrowRight className="size-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatPill label="Total" value={stats.total} />
            <StatPill label="Resolved" value={stats.resolved} />
            <StatPill label="Pending" value={stats.pending} />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-black">{value.toLocaleString("en-IN")}</p>
    </div>
  );
}
