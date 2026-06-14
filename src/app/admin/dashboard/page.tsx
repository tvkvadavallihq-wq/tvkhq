import { AdminCharts } from "@/components/admin/admin-charts";
import { AdminMetricCards } from "@/components/admin/admin-metric-cards";
import { AdminRecentComplaints } from "@/components/admin/admin-recent-complaints";
import { Card, CardContent } from "@/components/ui/card";
import { ComplaintStatus } from "@/lib/enums";
import { getAdminSession } from "@/lib/repositories/admin";
import { getAdminComplaintList } from "@/lib/repositories/admin-complaints";
import { getAdminDashboard } from "@/lib/repositories/admin";
import { userRoleTamil } from "@/lib/enums";
import { adminComplaintListFiltersSchema } from "@/lib/validators";
import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/enums";

export const metadata = {
  title: "நிர்வாக பலகை",
};

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildQueryHref(current: SearchParams, updates: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();

  const preservedKeys = ["q", "ward", "category", "assignee", "status", "sort", "order", "bucket"];
  preservedKeys.forEach((key) => {
    const value = firstValue(current[key]);
    if (value && value.trim()) {
      searchParams.set(key, value);
    }
  });

  Object.entries(updates).forEach(([key, value]) => {
    if (value && value.trim()) {
      searchParams.set(key, value);
    } else {
      searchParams.delete(key);
    }
  });

  searchParams.set("page", "1");

  const query = searchParams.toString();
  return query ? `/admin/dashboard?${query}` : "/admin/dashboard";
}

function bucketLabel(bucket: string | undefined) {
  if (bucket === "pending") return "நிலுவை புகார்கள்";
  if (bucket === "assigned") return "ஒதுக்கப்பட்ட புகார்கள்";
  if (bucket === "resolved") return "தீர்க்கப்பட்ட புகார்கள்";
  return "அனைத்து புகார்கள்";
}

function bucketStatuses(bucket: string | undefined) {
  if (bucket === "pending") {
    return [ComplaintStatus.NEW, ComplaintStatus.VERIFIED, ComplaintStatus.IN_PROGRESS, ComplaintStatus.WAITING_GOVT];
  }

  if (bucket === "assigned") {
    return [ComplaintStatus.ASSIGNED];
  }

  if (bucket === "resolved") {
    return [ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED];
  }

  return undefined;
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const session = await getAdminSession();

  if (!session.user || !session.profile) {
    redirect("/admin/login");
  }

  const resolvedSearchParams = (await (searchParams ?? Promise.resolve({}))) as SearchParams;
  const parsed = adminComplaintListFiltersSchema.safeParse({
    q: firstValue(resolvedSearchParams.q),
    ward: firstValue(resolvedSearchParams.ward),
    category: firstValue(resolvedSearchParams.category),
    assignee: firstValue(resolvedSearchParams.assignee),
    status: firstValue(resolvedSearchParams.status),
    sort: firstValue(resolvedSearchParams.sort),
    order: firstValue(resolvedSearchParams.order),
    page: firstValue(resolvedSearchParams.page),
  });

  const current = parsed.success ? parsed.data : { page: 1, sort: "created_at" as const, order: "desc" as const };
  const bucket = firstValue(resolvedSearchParams.bucket);
  const category = current.category;

  const dashboard = await getAdminDashboard();
  const normalizedCategory = category && dashboard.complaintsByCategory.some((item) => item.id === category) ? category : undefined;
  const linkSearchParams = { ...resolvedSearchParams, category: normalizedCategory } as SearchParams;
  const filteredComplaints = await getAdminComplaintList(session.profile, {
    q: current.q,
    ward: current.ward,
    category: normalizedCategory,
    assignee: current.assignee,
    status: current.status,
    statuses: bucketStatuses(bucket),
    sort: "created_at",
    order: "desc",
    page: 1,
    pageSize: 8,
  });

  const activeBucket = bucket ?? "all";
  const activeTitle = bucketLabel(bucket);
  const selectedCategoryLabel = normalizedCategory
    ? dashboard.complaintsByCategory.find((item) => item.id === normalizedCategory)?.label ?? "தேர்ந்த வகை"
    : null;

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
              {dashboard.profile?.role ? ` ${userRoleTamil[dashboard.profile.role as UserRole]}` : " நிர்வாகம்"}
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
          { label: "மொத்த புகார்கள்", value: dashboard.metrics.total, tone: "primary", href: buildQueryHref(linkSearchParams, { bucket: undefined }), selected: activeBucket === "all" },
          { label: "நிலுவை", value: dashboard.metrics.pending, tone: "warning", href: buildQueryHref(linkSearchParams, { bucket: "pending" }), selected: activeBucket === "pending" },
          { label: "ஒதுக்கப்பட்டது", value: dashboard.metrics.assigned, tone: "secondary", href: buildQueryHref(linkSearchParams, { bucket: "assigned" }), selected: activeBucket === "assigned" },
          { label: "தீர்க்கப்பட்டது", value: dashboard.metrics.resolved, tone: "success", href: buildQueryHref(linkSearchParams, { bucket: "resolved" }), selected: activeBucket === "resolved" },
        ]}
      />

      <AdminCharts
        complaintsByWard={dashboard.complaintsByWard}
        complaintsByCategory={dashboard.complaintsByCategory.map((item) => ({
          ...item,
          href: item.id ? buildQueryHref(linkSearchParams, { category: item.id }) : undefined,
          selected: Boolean(normalizedCategory && item.id === normalizedCategory),
        }))}
        resolutionTime={dashboard.resolutionTime}
      />

      <AdminRecentComplaints
        title={`${activeTitle}${selectedCategoryLabel ? ` · ${selectedCategoryLabel}` : ""} · புகார்கள்`}
        description={
          bucket
            ? "மேல் உள்ள insight-ஐத் தேர்ந்தெடுத்ததன் அடிப்படையில் வடிகட்டப்பட்ட புகார்கள் கீழே காட்டப்படுகின்றன."
            : "மொத்த புகார்கள் காட்சி. மேலே உள்ள insight cards-ஐ கிளிக் செய்து பட்டியலை வடிகட்டலாம்."
        }
        emptyText="தேர்ந்தெடுத்த insight-க்கு பொருந்தும் புகார்கள் இல்லை."
        complaints={filteredComplaints.items.map((complaint) => ({
          id: complaint.id,
          tracking_id: complaint.complaint_number,
          title: complaint.title,
          address: complaint.address,
          status: complaint.current_status,
          priority: complaint.priority,
          created_at: complaint.created_at,
          ward_number: complaint.ward_number,
          category_name_ta: complaint.category_name_ta,
        }))}
      />
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
