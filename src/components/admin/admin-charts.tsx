import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ChartDatum = { label: string; value: number; href?: string; selected?: boolean };

export function AdminCharts({
  complaintsByWard,
  complaintsByCategory,
  resolutionTime,
}: {
  complaintsByWard: ChartDatum[];
  complaintsByCategory: ChartDatum[];
  resolutionTime: ChartDatum[];
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <ChartCard title="வார்டு வாரியாக புகார்கள்" data={complaintsByWard} tone="primary" />
      <ChartCard title="வகை வாரியாக புகார்கள்" data={complaintsByCategory} tone="secondary" />
      <ChartCard title="தீர்வு நேரம்" data={resolutionTime} tone="emerald" />
    </div>
  );
}

function ChartCard({
  title,
  data,
  tone,
}: {
  title: string;
  data: ChartDatum[];
  tone: "primary" | "secondary" | "emerald";
}) {
  const max = Math.max(...data.map((item) => item.value), 1);
  const barClass =
    tone === "primary" ? "bg-primary" : tone === "secondary" ? "bg-secondary" : "bg-emerald-500";

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">தரவு கிடைக்கவில்லை.</p>
        ) : (
          <div className="space-y-3">
            {data.map((item) => {
              const width = `${Math.max(6, Math.round((item.value / max) * 100))}%`;
              const rowClass = cn(
                "space-y-1 rounded-xl border border-transparent p-2 -mx-2 transition",
                item.href && "cursor-pointer hover:border-border hover:bg-muted/40",
                item.selected && "border-primary/30 bg-primary/5",
              );
              return (
                <div key={item.label} className={rowClass}>
                  {item.href ? (
                    <Link href={item.href as never} className="block">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate font-medium">{item.label}</span>
                        <span className="font-bold">{item.value}</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-muted">
                        <div className={`h-2 rounded-full ${barClass}`} style={{ width }} />
                      </div>
                    </Link>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate font-medium">{item.label}</span>
                        <span className="font-bold">{item.value}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div className={`h-2 rounded-full ${barClass}`} style={{ width }} />
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
