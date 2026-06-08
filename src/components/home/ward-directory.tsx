import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { HomepageWardContact } from "@/lib/repositories/public";

export function WardDirectory({
  wards,
  wardContacts,
  area,
  ward,
}: {
  wards: Array<{ id: string; ward_number: number }>;
  wardContacts: HomepageWardContact[];
  area: string;
  ward: string;
}) {
  return (
    <div className="space-y-5">
      <form className="grid gap-3 rounded-3xl border bg-card p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-end" method="get">
        <div className="space-y-2">
          <label htmlFor="area" className="text-sm font-semibold">
            பகுதி மூலம் தேடுங்கள்
          </label>
          <Input id="area" name="area" defaultValue={area} placeholder="பகுதி பெயர்" />
        </div>
        <div className="space-y-2">
          <label htmlFor="ward" className="text-sm font-semibold">
            வார்டு மூலம் தேடுங்கள்
          </label>
          <select id="ward" name="ward" defaultValue={ward} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
            <option value="">அனைத்து வார்டுகள்</option>
            {wards.map((item) => (
              <option key={item.id} value={String(item.ward_number)}>
                வார்டு {item.ward_number}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" className="h-10">
          <Search className="size-4" />
          Search
        </Button>
      </form>

      <div className="grid gap-3">
        {wardContacts.length === 0 ? (
          <Card className="rounded-3xl">
            <CardContent className="p-5 text-sm text-muted-foreground">
              இந்த தேடலுக்கு பொருந்தும் வார்டு தொடர்புகள் இல்லை.
            </CardContent>
          </Card>
        ) : (
          wardContacts.map((contact) => (
            <Card key={contact.id} className="rounded-3xl">
              <CardContent className="grid gap-4 p-5 md:grid-cols-[1.2fr_0.8fr] md:items-center">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">
                      வார்டு {contact.ward_number ?? "-"}
                    </span>
                    {contact.area_name ? (
                      <span className="rounded-full border bg-background px-3 py-1 text-xs font-bold text-muted-foreground">{contact.area_name}</span>
                    ) : null}
                  </div>
                  <h3 className="text-lg font-black">{contact.name}</h3>
                  <p className="text-sm leading-6 text-muted-foreground">Area POC</p>
                  {contact.address ? <p className="text-sm leading-6 text-muted-foreground">{contact.address}</p> : null}
                </div>

                <div className="space-y-2 rounded-2xl border bg-muted/30 p-4">
                  <ContactLine label="மொபைல்" value={contact.phone} href={`tel:${contact.phone}`} />
                  {contact.whatsapp ? <ContactLine label="WhatsApp" value={contact.whatsapp} href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`} /> : null}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function ContactLine({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <a href={href} className="truncate text-sm font-bold text-primary">
        {value}
      </a>
    </div>
  );
}
