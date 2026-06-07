import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { AdminComplaintListItem } from "@/lib/repositories/admin-complaints";
import { cn } from "@/lib/utils";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ta-IN", { dateStyle: "medium" }).format(new Date(value));
}

export function AdminComplaintCard({ complaint }: { complaint: AdminComplaintListItem }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-black tracking-wide">{complaint.complaint_number}</span>
              <StatusBadge status={complaint.current_status} />
              <span
                className={cn(
                  "rounded-full px-2 py-1 text-xs font-bold",
                  complaint.priority >= 3 ? "bg-amber-100 text-amber-900" : "bg-muted text-muted-foreground",
                )}
              >
                P{complaint.priority}
              </span>
            </div>
            <h2 className="text-base font-bold leading-6 sm:text-lg">{complaint.title}</h2>
            <p className="text-sm leading-6 text-muted-foreground">{complaint.address}</p>
          </div>

          <Button asChild size="sm" variant="outline" className="shrink-0">
            <Link href={`/admin/complaints/${complaint.id}`}>
              <ArrowRight className="size-4" />
              திற
            </Link>
          </Button>
        </div>

        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <Detail label="மொபைல்" value={complaint.mobile} />
          <Detail label="வார்டு" value={complaint.ward_number ? `வார்டு ${complaint.ward_number}` : "-"} />
          <Detail label="வகை" value={complaint.category_name_ta ?? "-"} />
          <Detail label="பதிவு தேதி" value={formatDate(complaint.created_at)} />
          <Detail label="தீர்வு தேதி" value={complaint.resolved_at ? formatDate(complaint.resolved_at) : "-"} />
          <Detail label="புதுப்பிப்பு" value={formatDate(complaint.updated_at)} />
        </div>
      </CardContent>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/20 px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium leading-6">{value}</p>
    </div>
  );
}
