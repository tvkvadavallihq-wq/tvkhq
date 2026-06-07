import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminComplaintAssignmentRow, AdminComplaintUser } from "@/lib/repositories/admin-complaints";
import { userRoleTamil } from "@/lib/enums";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ta-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function AdminAssignmentHistory({
  assignments,
  usersById,
}: {
  assignments: AdminComplaintAssignmentRow[];
  usersById: Record<string, AdminComplaintUser>;
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
              const assignedTo = usersById[assignment.assigned_to] ?? null;
              const assignedBy = assignment.assigned_by ? usersById[assignment.assigned_by] ?? null : null;

              return (
                <div key={assignment.id} className="rounded-lg border bg-background p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold">{assignedBy ? assignedBy.full_name : "System"}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(assignment.created_at)}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {assignedBy ? userRoleTamil[assignedBy.role] : "System"}
                    {" → "}
                    {assignedTo ? `${assignedTo.full_name} · ${userRoleTamil[assignedTo.role]}` : assignment.assigned_to_role ?? "-"}
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
