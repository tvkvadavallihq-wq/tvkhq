import { AdminCharts } from "@/components/admin/admin-charts";
import { AdminMetricCards } from "@/components/admin/admin-metric-cards";
import { AdminRecentComplaints } from "@/components/admin/admin-recent-complaints";
import { getAdminDashboard } from "@/lib/repositories/admin";

export const metadata = {
  title: "நிர்வாக பலகை",
};

export default async function AdminDashboardPage() {
  const dashboard = await getAdminDashboard();

  return (
    <div className="space-y-5">
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
