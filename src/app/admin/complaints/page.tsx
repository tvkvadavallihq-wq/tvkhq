import { FileText, Filter } from "lucide-react";
import { redirect } from "next/navigation";
import { AdminComplaintCard } from "@/components/admin/complaints/admin-complaint-card";
import { AdminComplaintFilters } from "@/components/admin/complaints/admin-complaint-filters";
import { ComplaintsPagination } from "@/components/complaints/complaints-pagination";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminSession } from "@/lib/repositories/admin";
import { getAdminComplaintFilterOptions, getAdminComplaintList } from "@/lib/repositories/admin-complaints";
import { adminComplaintListFiltersSchema } from "@/lib/validators";

export const metadata = {
  title: "புகார் மேலாண்மை | TVK Vadavalli HQ",
  description: "Admin complaint list with filters, search, and sorting.",
};

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminComplaintsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const session = await getAdminSession();

  if (!session.user || !session.profile) {
    redirect("/admin/login");
  }

  const resolvedSearchParams = (await (searchParams ?? Promise.resolve({}))) as SearchParams;
  const parsed = adminComplaintListFiltersSchema.safeParse({
    q: firstValue(resolvedSearchParams.q),
    ward: firstValue(resolvedSearchParams.ward),
    category: firstValue(resolvedSearchParams.category),
    status: firstValue(resolvedSearchParams.status),
    sort: firstValue(resolvedSearchParams.sort),
    order: firstValue(resolvedSearchParams.order),
    page: firstValue(resolvedSearchParams.page),
  });

  const current = parsed.success ? parsed.data : { page: 1, sort: "created_at" as const, order: "desc" as const };
  const filters = {
    q: current.q,
    ward: current.ward,
    category: current.category,
    status: current.status,
    sort: current.sort,
    order: current.order,
    page: current.page,
  };

  const [filterOptions, complaints] = await Promise.all([getAdminComplaintFilterOptions(), getAdminComplaintList(session.profile, filters)]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/30 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
            <Filter className="size-3.5" />
            நிர்வாக புகார் மேலாண்மை
          </div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">புகார் மேலாண்மை</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            தேடல், வடிகட்டல், வரிசைப்படுத்தல் மற்றும் audit-ready புகார் வரலாறு ஒரே இடத்தில்.
          </p>
        </div>

        <div className="rounded-lg border bg-card px-4 py-3 text-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">மொத்தம்</p>
          <p className="mt-1 text-2xl font-black">{complaints.total}</p>
        </div>
      </div>

      <AdminComplaintFilters
        wards={filterOptions.wards.map((ward) => ({ id: ward.id, label: `Ward ${ward.ward_number}` }))}
        categories={filterOptions.categories.map((category) => ({ id: category.id, label: category.name_ta }))}
        current={filters}
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">
          {complaints.total > 0 ? `${complaints.total} புகார்கள்` : "புகார்கள் இல்லை"}
        </p>
        <p className="text-sm text-muted-foreground">
          பக்கம் {complaints.page} / {Math.max(complaints.pageCount, 1)}
        </p>
      </div>

      {complaints.items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>புகார்கள் இல்லை</CardTitle>
            <CardDescription>தேர்ந்தெடுத்த வடிகட்டிகளுக்கு பொருந்தும் புகார்கள் இல்லை.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">புதிய புகார் வந்ததும் இங்கே தோன்றும்.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {complaints.items.map((complaint) => (
            <AdminComplaintCard key={complaint.id} complaint={complaint} />
          ))}
        </div>
      )}

      <ComplaintsPagination
        basePath="/admin/complaints"
        page={complaints.page}
        pageCount={complaints.pageCount}
        params={{
          q: filters.q,
          ward: filters.ward,
          category: filters.category,
          status: filters.status,
          sort: filters.sort,
          order: filters.order,
        }}
      />
    </section>
  );
}
