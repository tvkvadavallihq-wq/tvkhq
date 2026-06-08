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
    <div className="min-h-screen bg-muted/20">
      <div className="lg:grid lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <AdminSidebar role={profile.role} fullName={profile.full_name} wardNumber={profile.ward_number ?? null} />
        </aside>

        <div className="flex min-h-screen min-w-0 flex-col">
          <div className="border-b bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
            <details className="group rounded-2xl border bg-background shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Admin Menu</p>
                  <p className="truncate text-sm font-black">{profile.full_name}</p>
                </div>
                <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-bold text-muted-foreground group-open:bg-primary group-open:text-primary-foreground">
                  திற
                </span>
              </summary>
              <div className="border-t p-3">
                <AdminSidebar role={profile.role} fullName={profile.full_name} wardNumber={profile.ward_number ?? null} />
              </div>
            </details>
          </div>

          <AdminHeader fullName={profile.full_name} role={profile.role} wardNumber={profile.ward_number ?? null} />
          <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-5 lg:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
