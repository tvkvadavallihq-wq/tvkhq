import Image from "next/image";
import { Crown, Landmark, ShieldCheck, UserRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/home/section-heading";

type LeaderProfile = {
  name: string;
  role: string;
  photo: string;
  summary: string;
  portfolio: Array<{ label: string; value: string }>;
  accent: "primary" | "secondary" | "emerald";
};

const leaders: LeaderProfile[] = [
  {
    name: "Hon. CM Vijay",
    role: "Founder · Chief Minister of Tamil Nadu",
    photo: "https://tvkvijay.com/footer/thalaivar.png",
    summary:
      "TVK-ஐ மக்கள் சேவையை மையமாகக் கொண்ட இயக்கமாக உயர்த்திய தலைவர். மக்கள் நலன், நிர்வாகப் பொறுப்பு, மற்றும் நேரடி அணுகுமுறை இவரது அடையாளம்.",
    portfolio: [
      { label: "Position", value: "Chief Minister" },
      { label: "Organisation", value: "Founder, TVK" },
      { label: "Focus", value: "People-centric governance" },
    ],
    accent: "primary",
  },
  {
    name: "Hon. Minister V. Sampath Kumar",
    role: "Coimbatore City District Secretary · MLA, Coimbatore North",
    photo: "/images/sampath-hero-hd.jpg",
    summary:
      "கோவை மாநகர் அமைப்பை முன்னெடுத்து, BC, MBC மற்றும் Denotified Communities Welfare portfolio-ஐ வகிக்கும் மாநில முக்கிய முகம்.",
    portfolio: [
      { label: "Constituency", value: "Coimbatore North (AC 118)" },
      { label: "Portfolio", value: "BC, MBC & Denotified Welfare" },
      { label: "Education", value: "MBA, Annamalai University" },
    ],
    accent: "secondary",
  },
  {
    name: "Mr. N. Anand",
    role: "General Secretary · Organisational Coordination",
    photo: "https://tvkassets.minsky.studio/media/warrior-1-1600x1067.png",
    summary:
      "அமைப்பு வலிமையின் தூணாக இருந்து, கட்சி உறுப்பினர்களை ஒருங்கிணைக்கும் நிர்வாகத் திறனுக்காக அறியப்படும் முக்கியப் பொறுப்பாளர்.",
    portfolio: [
      { label: "Office", value: "General Secretary" },
      { label: "Background", value: "Former fan-club leadership" },
      { label: "Strength", value: "Organisation & coordination" },
    ],
    accent: "emerald",
  },
];

export function LeadershipSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <SectionHeading
        eyebrow="Leadership"
        title="தலைமை மற்றும் பொறுப்பாளர்கள்"
        description="கட்சியின் வழிகாட்டிகள், நிர்வாகத் தூண்கள், மற்றும் மாவட்ட சேவைத் தலைமைகளின் விரிவான பார்வை."
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {leaders.map((leader) => (
          <Card key={leader.name} className="overflow-hidden border-border/70 shadow-sm">
            <CardContent className="p-0">
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <Image src={leader.photo} alt={leader.name} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                <div className="absolute left-4 right-4 bottom-4 space-y-2 text-white">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] backdrop-blur">
                    {leader.accent === "primary" ? <Crown className="size-3.5" /> : leader.accent === "secondary" ? <Landmark className="size-3.5" /> : <ShieldCheck className="size-3.5" />}
                    {leader.role}
                  </span>
                  <h3 className="text-xl font-black leading-tight sm:text-2xl">{leader.name}</h3>
                </div>
              </div>

              <div className="space-y-4 p-5">
                <p className="text-sm leading-6 text-muted-foreground">{leader.summary}</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {leader.portfolio.map((item) => (
                    <div key={item.label} className="rounded-2xl border bg-muted/30 p-3">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
                        <UserRound className="size-3.5" />
                        {item.label}
                      </div>
                      <p className="mt-2 text-sm font-semibold leading-6">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
