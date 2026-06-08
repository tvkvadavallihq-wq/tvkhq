import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, MapPinned, Phone, UserRound } from "lucide-react";
import { redirect } from "next/navigation";
import { AdminComplaintActionsPanel } from "@/components/admin/complaints/admin-complaint-actions-panel";
import { AdminActivityFeed } from "@/components/admin/complaints/admin-activity-feed";
import { AdminAssignmentHistory } from "@/components/admin/complaints/admin-assignment-history";
import { AdminMediaGallery } from "@/components/admin/complaints/admin-media-gallery";
import { ComplaintTimeline } from "@/components/complaints/complaint-timeline";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComplaintStatus } from "@/lib/enums";
import { getAdminSession } from "@/lib/repositories/admin";
import { getAdminComplaintActionConfig, getAdminComplaintDetail } from "@/lib/repositories/admin-complaints";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Complaint Detail | TVK Vadavalli HQ",
  description: "Complaint detail with full audit trail and action controls.",
};

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ta-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function AdminComplaintDetailPage({
  params,
}: {
  params: Promise<{ complaintId: string }>;
}) {
  const { complaintId } = await params;
  const session = await getAdminSession();

  if (!session.user || !session.profile) {
    redirect("/admin/login");
  }

  const detail = await getAdminComplaintDetail(complaintId, session.profile);

  if (!detail.complaint) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>புகார் கிடைக்கவில்லை</CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/admin/complaints">
              <ArrowLeft className="size-4" />
              புகார் பட்டியலுக்கு திரும்பு
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const actionConfig = await getAdminComplaintActionConfig(session.profile, detail.complaint.current_status, detail.complaint.ward_id);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <Button asChild variant="outline" size="sm" className="w-fit">
            <Link href="/admin/complaints">
              <ArrowLeft className="size-4" />
              புகார் பட்டியலுக்கு திரும்பு
            </Link>
          </Button>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-black">{detail.complaint.complaint_number}</span>
              <StatusBadge status={detail.complaint.current_status} />
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{detail.complaint.title}</h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{detail.complaint.description}</p>
          </div>
        </div>

        <div className="grid gap-2 rounded-lg border bg-card p-4 text-sm">
          <Stat label="வார்டு" value={detail.complaint.ward_number ? `வார்டு ${detail.complaint.ward_number}` : "-"} />
          <Stat label="வகை" value={detail.complaint.category_name_ta ?? "-"} />
          <Stat label="பதிவு" value={formatDateTime(detail.complaint.created_at)} />
          <Stat label="தீர்வு" value={formatDateTime(detail.complaint.resolved_at)} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>புகார் சுருக்கம்</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Detail label="மொபைல்" value={detail.complaint.mobile} icon={<Phone className="size-4" />} />
                <Detail label="வார்டு" value={detail.complaint.ward_number ? `வார்டு ${detail.complaint.ward_number}` : "-"} icon={<UserRound className="size-4" />} />
                <Detail label="முகவரி" value={detail.complaint.address} icon={<MapPinned className="size-4" />} className="md:col-span-2" />
                <Detail
                  label="GPS"
                  value={detail.complaint.latitude !== null && detail.complaint.longitude !== null ? `${detail.complaint.latitude}, ${detail.complaint.longitude}` : "-"}
                  className="md:col-span-2"
                />
              </div>

              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">நிலை வரிசை</p>
                <div className="mt-4">
                  <ComplaintTimeline currentStatus={detail.complaint.current_status as ComplaintStatus} />
                </div>
              </div>
            </CardContent>
          </Card>

          <AdminMediaGallery media={detail.media} />
          <AdminAssignmentHistory assignments={detail.assignments} usersById={detail.usersById} assigneesById={detail.assigneesById} />
          <AdminActivityFeed items={detail.activityFeed} />
        </div>

        <div className="space-y-6">
          <AdminComplaintActionsPanel
            complaintId={detail.complaint.id}
            complaintNumber={detail.complaint.complaint_number}
            currentStatus={detail.complaint.current_status}
            actionConfig={actionConfig}
          />

          <Card>
            <CardHeader>
              <CardTitle>நிலை வரலாறு</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {detail.statusHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">நிலை வரலாறு இல்லை.</p>
              ) : (
                detail.statusHistory
                  .slice()
                  .reverse()
                  .map((entry) => (
                    <div key={entry.id} className="rounded-lg border bg-background p-4">
                      <p className="text-sm font-bold">
                        {entry.old_status ?? "—"} → {entry.new_status ?? "—"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(entry.created_at)}</p>
                      {entry.remarks ? <p className="mt-2 text-sm leading-6">{entry.remarks}</p> : null}
                    </div>
                  ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

function Detail({
  label,
  value,
  icon,
  className,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border bg-background p-4", className)}>
      <div className="flex items-center gap-2">
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      </div>
      <p className="mt-2 text-sm leading-6">{value}</p>
    </div>
  );
}
