import { Shield } from "lucide-react";
import { AdminSignOutButton } from "@/components/admin/admin-signout-button";
import { UserRole, userRoleTamil } from "@/lib/enums";

export function AdminHeader({
  fullName,
  role,
  wardNumber,
}: {
  fullName: string;
  role: UserRole;
  wardNumber?: number | null;
}) {
  return (
    <header className="flex flex-col gap-3 border-b bg-background px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Admin Portal</p>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-black">நிர்வாக பலகை</h1>
          <span className="inline-flex items-center gap-1 rounded-full border bg-muted/40 px-2.5 py-1 text-xs font-bold">
            <Shield className="size-3.5" />
            {userRoleTamil[role]}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {fullName}
          {wardNumber ? ` · Ward ${wardNumber}` : ""}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <AdminSignOutButton />
      </div>
    </header>
  );
}
