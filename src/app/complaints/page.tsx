import Link from "next/link";
import { FileText, Filter } from "lucide-react";
import { ComplaintCard } from "@/components/complaints/complaint-card";
import { ComplaintFiltersForm } from "@/components/complaints/complaint-filters-form";
import { ComplaintsPagination } from "@/components/complaints/complaints-pagination";
import { RealtimeRefresh } from "@/components/complaints/realtime-refresh";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { complaintFiltersSchema } from "@/lib/validators";
import { getComplaintFilterOptions, getPublicComplaintList } from "@/lib/repositories/complaints";

export const metadata = {
  title: "புகார்கள் | TVK Vadavalli HQ",
  description: "Ward, category, status, and date filters for public complaint listings.",
};

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ComplaintsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedSearchParams = (await (searchParams ?? Promise.resolve({}))) as SearchParams;
  const parsed = complaintFiltersSchema.safeParse({
    ward: firstValue(resolvedSearchParams.ward),
    category: firstValue(resolvedSearchParams.category),
    status: firstValue(resolvedSearchParams.status),
    from: firstValue(resolvedSearchParams.from),
    to: firstValue(resolvedSearchParams.to),
    page: firstValue(resolvedSearchParams.page),
  });

  const current = parsed.success ? parsed.data : { page: 1 };
  const filters = {
    ward: current.ward,
    category: current.category,
    status: current.status,
    from: current.from,
    to: current.to,
    page: current.page,
  };

  const [filterOptions, complaints] = await Promise.all([getComplaintFilterOptions(), getPublicComplaintList(filters)]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <RealtimeRefresh watchAll />

      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/30 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
            <Filter className="size-3.5" />
            பொது புகார்கள்
          </div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">மக்கள் புகார்கள்</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            வார்டு, பகுதி, வகை, நிலை மற்றும் தேதியால் புகார்களை வடிகட்டிப் பார்க்கலாம்.
          </p>
        </div>

        <Button asChild>
          <Link href="/complaint/new">
            <FileText className="size-4" />
            புதிய புகார்
          </Link>
        </Button>
      </div>

      <div className="space-y-5">
        <ComplaintFiltersForm wards={filterOptions.wards} categories={filterOptions.categories} current={filters} />

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">
            {complaints.total > 0 ? `${complaints.total} புகார்கள் காணப்படுகின்றன` : "புகார்கள் இல்லை"}
          </p>
          <p className="text-sm text-muted-foreground">
            பக்கம் {complaints.page} / {Math.max(complaints.pageCount, 1)}
          </p>
        </div>

        {complaints.items.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>புகார்கள் இல்லை</CardTitle>
              <CardDescription>தேர்ந்தெடுத்த வடிகட்டிகளுக்கு பொருந்தும் புகார்கள் கிடைக்கவில்லை.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4">
            {complaints.items.map((complaint) => (
              <ComplaintCard key={complaint.id} complaint={complaint} />
            ))}
          </div>
        )}

        <ComplaintsPagination
          basePath="/complaints"
          page={complaints.page}
          pageCount={complaints.pageCount}
          params={{
            ward: filters.ward,
            category: filters.category,
            status: filters.status,
            from: filters.from,
            to: filters.to,
          }}
        />
      </div>
    </section>
  );
}
