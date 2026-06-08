import { AdminCharts } from "@/components/admin/admin-charts";
import { AdminMetricCards } from "@/components/admin/admin-metric-cards";
import { AdminRecentComplaints } from "@/components/admin/admin-recent-complaints";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminDashboard } from "@/lib/repositories/admin";
import { userRoleTamil } from "@/lib/enums";

export const metadata = {
  title: "நிர்வாக பலகை",
};

export default async function AdminDashboardPage() {
  const dashboard = await getAdminDashboard();

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-primary/10 via-background to-secondary/10 shadow-sm">
        <CardContent className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Admin Portal</p>
            <h2 className="text-2xl font-black leading-tight sm:text-3xl">நிர்வாக பலகை</h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {dashboard.profile?.full_name ?? "Admin"}
              {dashboard.profile?.ward_number ? ` · Ward ${dashboard.profile.ward_number}` : ""} ·
              {dashboard.profile?.role ? ` ${userRoleTamil[dashboard.profile.role]}` : " நிர்வாகம்"}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <MiniStat label="மொத்த புகார்கள்" value={dashboard.metrics.total} />
            <MiniStat label="நிலுவை" value={dashboard.metrics.pending} />
            <MiniStat label="தீர்க்கப்பட்டது" value={dashboard.metrics.resolved} />
          </div>
        </CardContent>
      </Card>

      <AdminMetricCards
        metrics={[
          { label: "மொத்த புகார்கள்", value: dashboard.metrics.total, tone: "primary" },
          { label: "நிலுவை", value: dashboard.metrics.pending, tone: "warning" },
          { label: "ஒதுக்கப்பட்டது", value: dashboard.metrics.assigned, tone: "secondary" },
          { label: "தீர்க்கப்பட்டது", value: dashboard.metrics.resolved, tone: "success" },
        ]}
      />

      <AdminCharts
        complaintsByWard={dashboard.complaintsByWard}
        complaintsByCategory={dashboard.complaintsByCategory}
        resolutionTime={dashboard.resolutionTime}
      />

      <AdminRecentComplaints complaints={dashboard.recentComplaints} />
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-background/80 px-4 py-3 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-black">{value.toLocaleString("en-IN")}</p>
    </div>
  );
}
