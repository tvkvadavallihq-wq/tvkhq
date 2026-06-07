import Link from "next/link";
import { APP_NAME, APP_NAME_TAMIL } from "@/lib/constants";
import { getAdminNavItems } from "@/lib/admin-navigation";
import { UserRole, userRoleTamil } from "@/lib/enums";

export function AdminSidebar({
  role,
  fullName,
  wardNumber,
}: {
  role?: UserRole | null;
  fullName: string;
  wardNumber?: number | null;
}) {
  const navItems = getAdminNavItems(role);

  return (
    <aside className="border-b bg-card/90 lg:min-h-screen lg:border-b-0 lg:border-r">
      <div className="sticky top-0 flex h-full flex-col gap-6 p-4 lg:p-5">
        <Link href="/admin/dashboard" className="space-y-1">
          <p className="text-sm font-semibold text-primary">{APP_NAME}</p>
          <p className="text-lg font-black leading-5">{APP_NAME_TAMIL}</p>
        </Link>

        <div className="rounded-xl border bg-muted/30 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">உள்நுழைந்தவர்</p>
          <p className="mt-1 text-base font-black">{fullName}</p>
          <p className="mt-1 text-sm text-muted-foreground">{role ? userRoleTamil[role] : "பங்கு இல்லை"}</p>
          {wardNumber ? <p className="mt-1 text-sm font-semibold">Ward {wardNumber}</p> : null}
        </div>

        <nav className="grid gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href as never}
                className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
