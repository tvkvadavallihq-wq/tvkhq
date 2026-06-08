import { Facebook, Instagram, MessageSquareMore, PhoneCall, Twitter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { HomepageBanner, HomepageWardContact } from "@/lib/repositories/public";

export function HomeFooter({
  contacts,
  banners,
}: {
  contacts: HomepageWardContact[];
  banners: HomepageBanner[];
}) {
  const primaryContact = contacts[0] ?? null;
  const socialLinks = banners.filter((banner) => Boolean(banner.link_url && /^https?:\/\//i.test(banner.link_url))).slice(0, 4);

  return (
    <footer className="border-t bg-muted/35">
      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-8 lg:grid-cols-[1fr_0.75fr]">
        <Card>
          <CardContent className="grid gap-5 p-5 md:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">தொடர்பு தகவல்</p>
              <h2 className="mt-2 text-xl font-black">TVK Vadavalli HQ</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                மக்கள் தொடர்பு மற்றும் புகார் ஒருங்கிணைப்புக்கான முக்கிய அலுவலக தகவல்கள்.
              </p>
              {primaryContact ? (
                <div className="mt-4 space-y-2 text-sm">
                  <p className="font-bold">{primaryContact.name}</p>
                  <p className="text-muted-foreground">{primaryContact.designation_ta}</p>
                  <a href={`tel:${primaryContact.phone}`} className="inline-flex items-center gap-2 font-bold text-primary">
                    <PhoneCall className="size-4" />
                    {primaryContact.phone}
                  </a>
                </div>
              ) : null}
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">சமூக இணைப்புகள்</p>
              <div className="flex flex-wrap gap-2">
                {socialLinks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">அலுவலகம் வெளியிடும் போது சமூக இணைப்புகள் இங்கே தோன்றும்.</p>
                ) : (
                  socialLinks.map((link, index) => (
                    <a
                      key={link.id}
                      href={link.link_url!}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-2 text-sm font-semibold hover:bg-muted"
                    >
                      {index === 0 ? <Facebook className="size-4" /> : index === 1 ? <Instagram className="size-4" /> : index === 2 ? <Twitter className="size-4" /> : <MessageSquareMore className="size-4" />}
                      {link.title_ta}
                    </a>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </footer>
  );
}
