import type { Metadata } from "next";
import { AnnouncementsSection } from "@/components/home/announcements-section";
import { HeroSection } from "@/components/home/hero-section";
import { HomeFooter } from "@/components/home/footer";
import { SectionHeading } from "@/components/home/section-heading";
import { StatisticsStrip } from "@/components/home/statistics-strip";
import { WardDirectory } from "@/components/home/ward-directory";
import { getHomepageFilters, getPublicHomeContent, type HomepageSearchParams } from "@/lib/repositories/public";

export const metadata: Metadata = {
  title: "TVK Vadavalli HQ",
  description: "Tamil-first public grievance platform for Vadavalli with live complaint tracking, ward directory, announcements, and public updates.",
  openGraph: {
    title: "TVK Vadavalli HQ",
    description: "Register complaints, track grievance status, and browse ward contacts in Tamil.",
    type: "website",
    images: [
      {
        url: "/images/tvkhq-banner.png",
        width: 2078,
        height: 757,
        alt: "TVK Vadavalli HQ banner",
      },
    ],
  },
};

function normalizeQueryValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await (searchParams ?? Promise.resolve({}))) as Record<string, string | string[] | undefined>;
  const filters: HomepageSearchParams = {
    area: normalizeQueryValue(resolvedSearchParams.area).trim(),
    ward: normalizeQueryValue(resolvedSearchParams.ward).trim(),
  };

  const [content, filtersData] = await Promise.all([getPublicHomeContent(filters), getHomepageFilters()]);
  const banners =
    content.banners.length > 0
      ? [{ id: "tvkhq-banner", title_ta: "TVK Vadavalli HQ", image_path: "/images/tvkhq-banner.png", link_url: "/" }, ...content.banners]
      : [{ id: "tvkhq-banner", title_ta: "TVK Vadavalli HQ", image_path: "/images/tvkhq-banner.png", link_url: "/" }];

  return (
    <main>
      <HeroSection heroBannerSrc="/images/tvkhq-banner.png" stats={content.stats} />

      <section className="mx-auto max-w-6xl px-4 py-8">
        <SectionHeading
          eyebrow="Live Metrics"
          title="புகார் நிலவரம்"
          description="பொதுமக்கள் எளிதாக புரியும் வகையில் தரவு சார்ந்த நிலை குறிப்புகள்."
        />
        <div className="mt-5">
          <StatisticsStrip stats={content.stats} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <SectionHeading
          eyebrow="Ward Directory"
          title="வார்டு தொடர்புகள்"
          description="பகுதி மற்றும் வார்டு அடிப்படையில் தேடி, செயலாளர் பெயர், மொபைல், WhatsApp மற்றும் முகவரியைப் பாருங்கள்."
        />
        <div className="mt-5">
          <WardDirectory wards={filtersData.wards} wardContacts={content.wardContacts} area={filters.area ?? ""} ward={filters.ward ?? ""} />
        </div>
      </section>

      <AnnouncementsSection announcements={content.announcements} banners={banners} />
      <HomeFooter banners={banners} />
    </main>
  );
}
