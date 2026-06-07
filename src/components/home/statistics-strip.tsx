import { Card, CardContent } from "@/components/ui/card";
import type { HomepageStats } from "@/lib/repositories/public";

export function StatisticsStrip({ stats }: { stats: HomepageStats }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="மொத்த புகார்கள்" value={stats.total} />
      <StatCard label="தீர்க்கப்பட்டது" value={stats.resolved} tone="success" />
      <StatCard label="நிலுவை" value={stats.pending} tone="warning" />
      <StatCard label="தீர்வு %" value={stats.resolutionRate} suffix="%" tone="primary" />
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix = "",
  tone = "neutral",
}: {
  label: string;
  value: number;
  suffix?: string;
  tone?: "neutral" | "success" | "warning" | "primary";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-700"
      : tone === "warning"
        ? "text-amber-700"
        : tone === "primary"
          ? "text-primary"
          : "text-foreground";

  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <p className={`mt-3 text-3xl font-black ${toneClass}`}>
          {value.toLocaleString("en-IN")}
          {suffix}
        </p>
      </CardContent>
    </Card>
  );
}
