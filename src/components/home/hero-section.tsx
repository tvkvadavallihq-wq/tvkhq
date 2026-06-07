import Link from "next/link";
import { ArrowRight, BadgeInfo, FilePlus2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { HomepageAnnouncement, HomepageStats } from "@/lib/repositories/public";

export function HeroSection({
  latestAnnouncement,
  heroBannerSrc,
  ministerPhotoSrc,
  stats,
}: {
  latestAnnouncement: HomepageAnnouncement | null;
  heroBannerSrc: string;
  ministerPhotoSrc: string;
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

          <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-amber-50 via-background to-stone-100 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b bg-background/80 px-4 py-3 backdrop-blur">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Featured Banner</p>
                <p className="text-sm font-semibold text-foreground">TVK Vadavalli HQ public banner</p>
              </div>
            </div>
            <div className="relative aspect-[16/9] min-h-[260px] overflow-hidden sm:min-h-[340px]">
              {heroBannerSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={heroBannerSrc} alt="TVK Vadavalli HQ banner" className="h-full w-full object-contain p-2 sm:p-4" />
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4 rounded-2xl border bg-background p-5 shadow-sm sm:p-6">
            <h1 className="text-3xl font-black leading-tight text-foreground sm:text-5xl">
              வடவள்ளிக்கான மக்கள் சேவை, புகார் தீர்வு மற்றும் வார்டு தகவல் அனைத்தும் ஒரே இடத்தில்.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              புகார்களை பதிவு செய்யவும், நிலையை அறியவும், உங்கள் வார்டு தொடர்பாளர்களை உடனே கண்டுபிடிக்கவும்.
              இது நேரடி தரவுடன் இயங்கும் பொதுத் தளம்.
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

          <Card className="overflow-hidden">
            <CardContent className="grid gap-4 p-5 sm:grid-cols-[120px_1fr] sm:items-start">
              <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
                {ministerPhotoSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ministerPhotoSrc} alt="Minister Sampath Kumar" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary/10 text-2xl font-black text-primary">
                    SK
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Minister Profile</p>
                  <h2 className="text-xl font-black">Minister Sampath Kumar</h2>
                  <p className="text-sm font-semibold text-muted-foreground">Public service and ward coordination</p>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  {latestAnnouncement?.body_ta ??
                    "மக்கள் பிரச்சனைகளுக்கு விரைவான தீர்வு, தெளிவான கண்காணிப்பு மற்றும் முழுமையான சேவை."}
                </p>
              </div>
            </CardContent>
          </Card>

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
