import { Facebook, Instagram, MessageSquareMore, PhoneCall, Twitter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { OFFICE_CONTACT } from "@/lib/constants";
import type { HomepageBanner } from "@/lib/repositories/public";

export function HomeFooter({
  banners,
}: {
  banners: HomepageBanner[];
}) {
  const socialLinks = banners.filter((banner) => Boolean(banner.redirect_url && /^https?:\/\//i.test(banner.redirect_url))).slice(0, 4);

  return (
    <footer className="border-t bg-muted/35">
      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-8 lg:grid-cols-[1fr_0.75fr]">
        <Card className="min-w-0">
          <CardContent className="grid min-w-0 gap-5 p-5 md:grid-cols-2">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">தொடர்பு தகவல்</p>
              <h2 className="mt-2 break-words text-xl font-black">{OFFICE_CONTACT.name}</h2>
              <div className="mt-3 space-y-2 break-words text-sm leading-6 text-muted-foreground">
                {OFFICE_CONTACT.addressLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
                <p>போன் : {OFFICE_CONTACT.phone}</p>
                <a href={`mailto:${OFFICE_CONTACT.email}`} className="inline-flex items-center gap-2 font-semibold text-primary">
                  மின் அஞ்சல் : {OFFICE_CONTACT.email}
                </a>
                <p>நேரம்: {OFFICE_CONTACT.hours}</p>
                <a href={`tel:${OFFICE_CONTACT.phone.replace(/\s+/g, "")}`} className="inline-flex items-center gap-2 font-bold text-primary">
                  <PhoneCall className="size-4" />
                  {OFFICE_CONTACT.phone}
                </a>
              </div>
            </div>

            <div className="min-w-0 space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">சமூக இணைப்புகள்</p>
              <div className="flex min-w-0 flex-wrap gap-2">
                {socialLinks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">அலுவலகம் வெளியிடும் போது சமூக இணைப்புகள் இங்கே தோன்றும்.</p>
                ) : (
                  socialLinks.map((link, index) => (
                    <a
                      key={link.id}
                      href={link.redirect_url!}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex max-w-full items-center gap-2 rounded-full border bg-background px-3 py-2 text-sm font-semibold hover:bg-muted"
                    >
                      {index === 0 ? <Facebook className="size-4" /> : index === 1 ? <Instagram className="size-4" /> : index === 2 ? <Twitter className="size-4" /> : <MessageSquareMore className="size-4" />}
                      {link.title}
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
