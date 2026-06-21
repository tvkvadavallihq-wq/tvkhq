import { redirect } from "next/navigation";
import { AdminLaunchSiteBanner } from "@/components/admin/admin-launch-site-banner";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { UserRole } from "@/lib/enums";
import { getAdminSession } from "@/lib/repositories/admin";
import { getSiteActive } from "@/lib/repositories/site";

export const metadata = {
  title: "நிர்வாக உள்நுழைவு",
};

export default async function AdminLoginPage() {
  const [session, siteActive] = await Promise.all([getAdminSession(), getSiteActive()]);

  if (session.user && siteActive) {
    redirect("/admin/dashboard");
  }

  return (
    <section className="mx-auto grid max-w-5xl gap-6 px-4 py-10">
      {!siteActive ? <AdminLaunchSiteBanner canLaunch={session.profile?.role === UserRole.SUPER_ADMIN} /> : null}
      {!session.user ? (
        <div className="mx-auto w-full max-w-md">
          <div className="mb-6">
            <h1 className="text-2xl font-black">நிர்வாக உள்நுழைவு</h1>
            <p className="mt-2 text-sm text-muted-foreground">அங்கீகரிக்கப்பட்ட நிர்வாகிகள் மட்டும்.</p>
          </div>
          <AdminLoginForm siteActive={siteActive} />
        </div>
      ) : null}
    </section>
  );
}
