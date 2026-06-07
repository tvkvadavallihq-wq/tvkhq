import type { ReactNode } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import type { AdminProfile } from "@/lib/repositories/admin";

export function AdminShell({
  profile,
  children,
}: {
  profile: AdminProfile;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/20 lg:grid lg:grid-cols-[280px_1fr]">
      <AdminSidebar role={profile.role} fullName={profile.full_name} wardNumber={profile.ward_number ?? null} />
      <div className="flex min-h-screen flex-col">
        <AdminHeader fullName={profile.full_name} role={profile.role} wardNumber={profile.ward_number ?? null} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
