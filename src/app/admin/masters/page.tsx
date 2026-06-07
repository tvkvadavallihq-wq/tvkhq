import { redirect } from "next/navigation";
import { UserRole } from "@/lib/enums";
import { AdminMasterDataManager } from "@/components/admin/master-data/admin-master-data-manager";
import { getAdminSession } from "@/lib/repositories/admin";
import { getAdminMasterData } from "@/lib/repositories/admin-master";

export const metadata = {
  title: "மாஸ்டர் தரவு | TVK Vadavalli HQ",
  description: "Manage users, categories, wards, areas, POCs, announcements, and banners.",
};

export default async function AdminMastersPage() {
  const session = await getAdminSession();

  if (!session.user || !session.profile) {
    redirect("/admin/login");
  }

  const data = await getAdminMasterData(session.profile);

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">மாஸ்டர் தரவு</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          வாட்வாதள்ளி HQ-க்கான பயனர்கள், வகைகள், வார்டுகள், பகுதிகள், POC, அறிவிப்புகள் மற்றும் பேனர்களை இங்கே நிர்வகிக்கலாம்.
        </p>
      </div>

      <AdminMasterDataManager data={data} canManageGlobal={session.profile.role === UserRole.SUPER_ADMIN} />
    </section>
  );
}
