import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminSession } from "@/lib/repositories/admin";

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const session = await getAdminSession();

  if (!session.user || !session.profile) {
    redirect("/admin/login");
  }

  return <AdminShell profile={session.profile}>{children}</AdminShell>;
}
