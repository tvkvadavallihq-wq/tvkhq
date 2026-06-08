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
    <header className="flex flex-col gap-3 border-b border-[#f4d08a]/30 bg-gradient-to-r from-[#3b0000] via-[#7a0d0d] to-[#b51f13] px-4 py-4 text-white shadow-[0_8px_30px_rgba(91,0,0,0.18)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-200">Admin Portal</p>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-black text-white">நிர்வாக பலகை</h1>
          <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-bold text-white">
            <Shield className="size-3.5" />
            {userRoleTamil[role]}
          </span>
        </div>
        <p className="text-sm text-white/85">
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
