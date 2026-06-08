import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminComplaintActivity } from "@/lib/repositories/admin-complaints";
import { userRoleTamil } from "@/lib/enums";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ta-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function AdminActivityFeed({ items }: { items: AdminComplaintActivity[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>செயல்பாட்டு வரலாறு</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">செயல்பாட்டு பதிவுகள் இல்லை.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-lg border bg-background p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold">{item.title}</p>
                <p className="text-xs text-muted-foreground">{formatDate(item.created_at)}</p>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.actor_name ? `${item.actor_name}${item.actor_role ? ` · ${userRoleTamil[item.actor_role]}` : ""}` : "System"}
              </p>
              {"target_name" in item && item.target_name ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.target_name}
                  {item.target_role ? ` · ${userRoleTamil[item.target_role]}` : ""}
                </p>
              ) : null}
              {"from_status" in item && item.from_status ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.from_status} → {item.to_status}
                </p>
              ) : null}
              {item.note ? <p className="mt-2 text-sm leading-6">{item.note}</p> : null}
              {"media_type" in item ? (
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">{item.media_type}</p>
              ) : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
