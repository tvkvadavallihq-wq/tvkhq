import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ComplaintStatus } from "@/lib/enums";
import { cn } from "@/lib/utils";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ta-IN", { dateStyle: "medium" }).format(new Date(value));
}

export function AdminRecentComplaints({
  complaints,
}: {
  complaints: Array<{
    id: string;
    tracking_id: string;
    title: string;
    address: string;
    status: ComplaintStatus;
    priority: number;
    created_at: string;
    ward_number: number | null;
    category_name_ta: string | null;
  }>;
}) {
  return (
      <Card>
      <CardHeader>
        <CardTitle>சமீபத்திய புகார்கள்</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {complaints.length === 0 ? (
          <p className="text-sm text-muted-foreground">புகார்கள் இல்லை.</p>
        ) : (
          complaints.map((complaint) => (
            <div key={complaint.id} className="grid gap-3 rounded-lg border p-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-muted-foreground">{complaint.tracking_id}</span>
                  <StatusBadge status={complaint.status} />
                  <span className={cn("rounded-full px-2 py-1 text-xs font-bold", complaint.priority >= 3 ? "bg-amber-100 text-amber-900" : "bg-muted text-muted-foreground")}>
                    P{complaint.priority}
                  </span>
                </div>
                <h3 className="font-bold">
                  <Link href={`/admin/complaints/${complaint.id}`} className="hover:underline">
                    {complaint.title}
                  </Link>
                </h3>
                <p className="text-sm text-muted-foreground">{complaint.address}</p>
                <p className="text-xs text-muted-foreground">
                  {complaint.ward_number ? `Ward ${complaint.ward_number}` : "Ward not set"} · {complaint.category_name_ta ?? "Uncategorized"}
                </p>
              </div>
              <div className="text-sm font-medium text-muted-foreground">{formatDate(complaint.created_at)}</div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
