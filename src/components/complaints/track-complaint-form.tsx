"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { FileVideo2, Loader2, Search } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { ComplaintTimeline } from "@/components/complaints/complaint-timeline";
import { CopyTrackingButton } from "@/components/complaints/copy-tracking-button";
import { RealtimeRefresh } from "@/components/complaints/realtime-refresh";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ComplaintTrackingResult } from "@/lib/repositories/complaints";
import { trackingSchema, type TrackingFormValues } from "@/lib/validators";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ta-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function TrackComplaintForm() {
  const lastValuesRef = useRef<TrackingFormValues | null>(null);
  const [result, setResult] = useState<ComplaintTrackingResult | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TrackingFormValues>({
    resolver: zodResolver(trackingSchema),
  });

  const mutation = useMutation({
    mutationFn: async (values: TrackingFormValues) => {
      const response = await fetch("/api/complaints/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const payload = (await response.json()) as { ok: boolean; complaint?: ComplaintTrackingResult; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "புகார் தேட முடியவில்லை.");
      }

      return payload.complaint ?? null;
    },
    onSuccess(nextResult, values) {
      lastValuesRef.current = values;
      setResult(nextResult);
    },
  });

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="pt-5">
          <form className="grid gap-5" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
            <Field id="tracking_id" label="புகார் எண்" error={errors.tracking_id?.message}>
              <Input id="tracking_id" placeholder="TVK-CBE-YYYY-XXXXXX" {...register("tracking_id")} />
            </Field>
            <Field id="phone" label="பதிவு செய்த மொபைல் எண்" error={errors.phone?.message}>
              <Input id="phone" inputMode="numeric" autoComplete="tel" {...register("phone")} />
            </Field>
            {mutation.error ? <p className="text-sm font-semibold text-destructive">{mutation.error.message}</p> : null}
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              தேடுக
            </Button>
          </form>
        </CardContent>
      </Card>

      {result ? (
          <>
            <RealtimeRefresh complaintId={result.id} trackingId={result.tracking_id} />
            <Card>
              <CardContent className="space-y-4 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-bold">{result.tracking_id}</span>
                <StatusBadge status={result.status} />
                <CopyTrackingButton trackingId={result.tracking_id} />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <InfoBlock label="தலைப்பு" value={result.title} />
                  <InfoBlock label="மொபைல்" value={result.mobile} />
                  <InfoBlock label="வார்டு" value={result.ward ? `வார்டு ${result.ward.ward_number}` : "-"} />
                  <InfoBlock label="வகை" value={result.category?.name_ta ?? "-"} />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <InfoBlock label="முகவரி" value={result.address} />
                  <InfoBlock label="GPS" value={result.latitude !== null && result.longitude !== null ? `${result.latitude}, ${result.longitude}` : "-"} />
                  <InfoBlock label="பதிவு நேரம்" value={formatDateTime(result.created_at)} />
                  <InfoBlock label="தீர்வு நேரம்" value={result.resolved_at ? formatDateTime(result.resolved_at) : "-"} />
                </div>

                <div className="rounded-lg border bg-muted/20 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">புகார் விவரம்</p>
                  <p className="mt-2 text-sm leading-6">{result.description}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
              <CardTitle>நிலை வரிசை</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <ComplaintTimeline currentStatus={result.status} />
                <div className="space-y-3">
                  {result.history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">நிலை வரிசை இன்னும் கிடைக்கவில்லை.</p>
                  ) : (
                    result.history.map((entry) => (
                      <div key={entry.id} className="rounded-md border p-4">
                        <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-medium text-muted-foreground">{formatDateTime(entry.created_at)}</p>
                      </div>
                      {entry.note ? <p className="mt-2 text-sm leading-6">{entry.note}</p> : <p className="mt-2 text-sm text-muted-foreground">குறிப்பு இல்லை.</p>}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>ஒதுக்கீடு</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.assignment ? (
                  <>
                    <InfoBlock label="பெறுநர்" value={result.assignment.assigned_to?.full_name ?? "-"} />
                    <InfoBlock label="தொலைபேசி" value={result.assignment.assigned_to?.phone ?? "-"} />
                    <InfoBlock label="பங்கு" value={result.assignment.assigned_to?.role ?? "-"} />
                    <InfoBlock label="ஒதுக்கப்பட்ட நேரம்" value={formatDateTime(result.assignment.assigned_at)} />
                    {result.assignment.note ? <p className="text-sm leading-6 text-muted-foreground">{result.assignment.note}</p> : null}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">இதுவரை ஒதுக்கீடு செய்யப்படவில்லை.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>தீர்வு புகைப்படங்கள்</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.media.length === 0 ? (
                  <p className="text-sm text-muted-foreground">தீர்வு புகைப்படங்கள் இன்னும் இல்லை.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {result.media
                      .filter((item) => item.media_type.startsWith("image/"))
                      .map((item) => (
                        <a key={item.id} href={item.file_url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-lg border bg-background">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.file_url} alt="Resolution" className="h-44 w-full object-cover" />
                        </a>
                      ))}
                  </div>
                )}
                <div className="grid gap-2">
                  {result.media
                    .filter((item) => item.media_type.startsWith("video/"))
                    .map((item) => (
                      <a key={item.id} href={item.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-md border bg-muted/20 px-3 py-2 text-sm font-medium">
                        <FileVideo2 className="size-4" />
                        வீடியோ இணைப்பு
                      </a>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium leading-6">{value}</p>
    </div>
  );
}
