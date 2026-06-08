import { Megaphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/home/section-heading";
import { BannersCarousel } from "@/components/home/banners-carousel";
import type { HomepageAnnouncement, HomepageBanner } from "@/lib/repositories/public";

export function AnnouncementsSection({
  announcements,
  banners,
}: {
  announcements: HomepageAnnouncement[];
  banners: HomepageBanner[];
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="overflow-hidden rounded-3xl">
          <CardContent className="space-y-5 p-5 sm:p-6">
            <SectionHeading
              eyebrow="அண்மை புதுப்பிப்புகள்"
              title="அறிவிப்புகள்"
              description="பொதுமக்களுக்கு முக்கியமான அறிவிப்புகள் மற்றும் சேவை புதுப்பிப்புகள்."
            />
            <div className="space-y-3">
              {announcements.length === 0 ? (
                <p className="text-sm text-muted-foreground">தற்போது புதிய அறிவிப்புகள் இல்லை.</p>
              ) : (
                announcements.map((announcement) => (
                  <article key={announcement.id} className="rounded-2xl border bg-background p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                      <Megaphone className="size-3.5" />
                      புதுப்பிப்பு
                    </div>
                    <h3 className="mt-2 text-base font-black">{announcement.title_ta}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{announcement.body_ta}</p>
                  </article>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="space-y-1 px-1">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">பேனர்</p>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Banner Carousel</h2>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">முக்கிய செய்திகள், சேவை அறிவிப்புகள், மற்றும் சிறப்பு தகவல்கள் பெரியதாகவும் தெளிவாகவும் காட்டப்படுகின்றன.</p>
          </div>
          <BannersCarousel banners={banners} />
        </div>
      </div>
    </section>
  );
}
