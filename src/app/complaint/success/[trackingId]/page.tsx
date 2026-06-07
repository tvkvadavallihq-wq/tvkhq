import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { CheckCircle2, FileImage, FileVideo2, MapPin, PhoneCall, ShieldCheck } from "lucide-react";
import { CopyTrackingButton } from "@/components/complaints/copy-tracking-button";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getComplaintByTrackingId } from "@/lib/repositories/complaints";
import type { ComplaintStatus } from "@/lib/enums";

export const metadata = {
  title: "புகார் பதிவு வெற்றி",
};

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("ta-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(dateString));
}

function countMediaItems(media: Array<{ media_type: string }>) {
  return {
    images: media.filter((item) => item.media_type.startsWith("image/")).length,
    videos: media.filter((item) => item.media_type.startsWith("video/")).length,
  };
}

export default async function ComplaintSuccessPage({
  params,
}: {
  params: Promise<{ trackingId: string }>;
}) {
  const { trackingId } = await params;
  const complaint = await getComplaintByTrackingId(trackingId);

  if (!complaint) {
    notFound();
  }

  const media = complaint.media;
  const mediaCount = countMediaItems(media as Array<{ media_type: string }>);

  return (
    <section className="mx-auto max-w-4xl px-4 py-8">
      <Card className="border-emerald-200 bg-emerald-50/60">
        <CardContent className="space-y-5 p-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-2 text-sm font-bold text-emerald-900">
            <CheckCircle2 className="size-4" />
            புகார் வெற்றிகரமாக பதிவு செய்யப்பட்டது
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">புகார் எண்</p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight">{complaint.tracking_id}</h1>
              <CopyTrackingButton trackingId={complaint.tracking_id} />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <InfoPill icon={<ShieldCheck className="size-4" />} label="நிலை" value={<StatusBadge status={complaint.status as ComplaintStatus} />} />
            <InfoPill icon={<MapPin className="size-4" />} label="வார்டு" value={complaint.ward ? `வார்டு ${complaint.ward.ward_number}` : "-"} />
            <InfoPill icon={<PhoneCall className="size-4" />} label="மொபைல்" value={complaint.mobile} />
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>புகார் சுருக்கம்</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SummaryRow label="தலைப்பு" value={complaint.title} />
            <SummaryRow label="Category" value={complaint.category?.name_ta ?? "-"} />
            <SummaryRow label="Address" value={complaint.address} />
            <SummaryRow
              label="GPS"
              value={complaint.latitude !== null && complaint.longitude !== null ? `${complaint.latitude}, ${complaint.longitude}` : "-"}
            />
            <SummaryRow label="Description" value={complaint.description} />
            <SummaryRow label="Created At" value={formatDate(complaint.created_at)} />
            <SummaryRow label="Resolution Date" value={complaint.resolved_at ? formatDate(complaint.resolved_at) : "-"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ஏற்றப்பட்ட கோப்புகள்</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <UploadSummary icon={<FileImage className="size-4" />} label="Images" count={mediaCount.images} />
            <UploadSummary icon={<FileVideo2 className="size-4" />} label="Videos" count={mediaCount.videos} />
            <p className="text-sm text-muted-foreground">
              நிலை மாற்ற பதிவு தானாக சேமிக்கப்பட்டுள்ளது.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/track">புகார் நிலையைப் பார்க்க</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/complaint/new">மற்றொரு புகார் பதிவு</Link>
        </Button>
      </div>
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium leading-6">{value}</p>
    </div>
  );
}

function InfoPill({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-sm font-bold">{value}</div>
    </div>
  );
}

function UploadSummary({ icon, label, count }: { icon: ReactNode; label: string; count: number }) {
  return (
    <div className="flex items-center justify-between rounded-md border bg-muted/20 px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        {label}
      </div>
      <div className="text-sm font-black">{count}</div>
    </div>
  );
}
