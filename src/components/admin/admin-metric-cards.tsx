import { Card, CardContent } from "@/components/ui/card";

export function AdminMetricCards({
  metrics,
}: {
  metrics: Array<{ label: string; value: number; tone: "primary" | "secondary" | "success" | "warning" }>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.label}>
          <CardContent className="space-y-2 p-4">
            <p className="text-sm font-semibold text-muted-foreground">{metric.label}</p>
            <p className="text-3xl font-black">{metric.value}</p>
            <div
              className={
                metric.tone === "primary"
                  ? "h-1.5 rounded-full bg-primary"
                  : metric.tone === "secondary"
                    ? "h-1.5 rounded-full bg-secondary"
                    : metric.tone === "success"
                      ? "h-1.5 rounded-full bg-emerald-500"
                      : "h-1.5 rounded-full bg-amber-500"
              }
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
