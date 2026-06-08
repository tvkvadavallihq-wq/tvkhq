import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminComplaintAssignee, AdminComplaintAssignmentRow, AdminComplaintUser } from "@/lib/repositories/admin-complaints";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ta-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function AdminAssignmentHistory({
  assignments,
  usersById,
  assigneesById,
}: {
  assignments: AdminComplaintAssignmentRow[];
  usersById: Record<string, AdminComplaintUser>;
  assigneesById: Record<string, AdminComplaintAssignee>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>ஒதுக்கீட்டு வரலாறு</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {assignments.length === 0 ? (
          <p className="text-sm text-muted-foreground">ஒதுக்கீடு பதிவுகள் இல்லை.</p>
        ) : (
          assignments
            .slice()
            .reverse()
            .map((assignment) => {
              const assignedTo = assigneesById[assignment.assigned_to] ?? null;
              const assignedBy = assignment.assigned_by ? usersById[assignment.assigned_by] ?? null : null;

              return (
                <div key={assignment.id} className="rounded-lg border bg-background p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold">{assignedBy ? assignedBy.full_name : "System"}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(assignment.created_at)}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {assignedBy ? assignedBy.full_name : "System"}
                    {" → "}
                    {assignedTo ? `${assignedTo.area_name}${assignedTo.mobile ? ` · ${assignedTo.mobile}` : ""}` : "-"}
                  </p>
                  {assignment.remarks ? <p className="mt-2 text-sm leading-6">{assignment.remarks}</p> : null}
                </div>
              );
            })
        )}
      </CardContent>
    </Card>
  );
}
