import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { getAdminSession } from "@/lib/repositories/admin";

export const metadata = {
  title: "நிர்வாக உள்நுழைவு",
};

export default async function AdminLoginPage() {
  const session = await getAdminSession();

  if (session.user) {
    redirect("/admin/dashboard");
  }

  return (
    <section className="mx-auto max-w-md px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-black">நிர்வாக உள்நுழைவு</h1>
        <p className="mt-2 text-sm text-muted-foreground">அங்கீகரிக்கப்பட்ட நிர்வாகிகள் மட்டும்.</p>
      </div>
      <AdminLoginForm />
    </section>
  );
}
