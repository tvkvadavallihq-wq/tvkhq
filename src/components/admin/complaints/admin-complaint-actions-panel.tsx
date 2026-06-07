"use client";

import { useMutation } from "@tanstack/react-query";
import { BadgeCheck, Loader2, MessageSquareText, RotateCcw, UploadCloud, UserRoundPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ComplaintStatus, complaintStatusTamil, userRoleTamil } from "@/lib/enums";
import type { AdminComplaintActionConfig } from "@/lib/repositories/admin-complaints";
import { cn } from "@/lib/utils";

function buildPayload(form: HTMLFormElement) {
  return new FormData(form);
}

export function AdminComplaintActionsPanel({
  complaintId,
  complaintNumber,
  currentStatus,
  actionConfig,
}: {
  complaintId: string;
  complaintNumber: string;
  currentStatus: ComplaintStatus;
  actionConfig: AdminComplaintActionConfig;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(`/api/admin/complaints/${complaintId}`, {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as { ok: boolean; message?: string; error?: string };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? payload.message ?? "செயல் நிறைவேறவில்லை.");
      }

      return payload.message ?? "செயல் நிறைவேறியது.";
    },
    onSuccess(nextMessage) {
      setMessage(nextMessage);
      router.refresh();
    },
    onError(error) {
      setMessage(error instanceof Error ? error.message : "செயல் நிறைவேறவில்லை.");
    },
  });

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    await mutation.mutateAsync(buildPayload(event.currentTarget));
    event.currentTarget.reset();
  };

  const statusOptions = actionConfig.allowedStatuses.filter((status) => status !== currentStatus);

  return (
    <Card>
      <CardHeader>
        <CardTitle>நிர்வாக செயல்கள்</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full border bg-muted/30 px-2.5 py-1 font-semibold">{complaintNumber}</span>
          <span className={cn("rounded-full border px-2.5 py-1 font-semibold", "bg-background")}>{complaintStatusTamil[currentStatus]}</span>
        </div>

        {message ? <p className="rounded-md border border-dashed bg-muted/20 px-3 py-2 text-sm font-medium">{message}</p> : null}

        {currentStatus === ComplaintStatus.NEW && actionConfig.canVerify ? (
          <form className="space-y-3 rounded-lg border bg-background p-4" onSubmit={submitForm}>
            <input type="hidden" name="action" value="verify" />
            <div className="space-y-1">
              <p className="text-sm font-bold">புகாரை சரிபார்க்கவும்</p>
              <p className="text-sm text-muted-foreground">புகாரை சரிபார்த்து அதிகாரப்பூர்வ பணிப்பாய்வில் கொண்டு வாருங்கள்.</p>
            </div>
            <Textarea name="remarks" placeholder="குறிப்பு (விருப்பம்)" />
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <BadgeCheck className="size-4" />}
              சரிபார்க்கவும்
            </Button>
          </form>
        ) : null}

        <form className="space-y-3 rounded-lg border bg-background p-4" onSubmit={submitForm}>
          <input type="hidden" name="action" value="assign" />
          <div className="space-y-1">
            <p className="text-sm font-bold">புகாரை ஒதுக்கவும்</p>
            <p className="text-sm text-muted-foreground">தேர்ந்தெடுத்த அடுத்த நிலை பொறுப்பாளருக்கு ஒதுக்கவும்.</p>
          </div>
          <div className="space-y-2">
            <label htmlFor="assigned_to" className="text-sm font-semibold">
              ஒதுக்க வேண்டியவர்
            </label>
            <select id="assigned_to" name="assigned_to" required className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">பயனரைத் தேர்வு செய்யவும்</option>
              {actionConfig.assignableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name} · {userRoleTamil[user.role]}{user.ward_number ? ` · Ward ${user.ward_number}` : ""}
                </option>
              ))}
            </select>
          </div>
          <Textarea name="remarks" placeholder="ஒதுக்கீட்டு குறிப்பு (விருப்பம்)" />
          <Button type="submit" className="w-full" disabled={mutation.isPending || actionConfig.assignableUsers.length === 0}>
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <UserRoundPlus className="size-4" />}
            ஒதுக்கவும்
          </Button>
          {actionConfig.assignableUsers.length === 0 ? <p className="text-sm text-muted-foreground">ஒதுக்க ஏற்ற பயனர்கள் இல்லை.</p> : null}
        </form>

        <form className="space-y-3 rounded-lg border bg-background p-4" onSubmit={submitForm}>
          <input type="hidden" name="action" value="status" />
          <div className="space-y-1">
            <p className="text-sm font-bold">நிலை மாற்றம்</p>
            <p className="text-sm text-muted-foreground">நிலை மாற்றம் செய்தால் audit trail தானாக பதிவு செய்யப்படும்.</p>
          </div>
          <div className="space-y-2">
            <label htmlFor="status" className="text-sm font-semibold">
              நிலை
            </label>
            <select id="status" name="status" required className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">நிலையைத் தேர்வு செய்யவும்</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {complaintStatusTamil[status]}
                </option>
              ))}
            </select>
          </div>
          <Textarea name="remarks" placeholder="நிலை மாற்றக் குறிப்பு (விருப்பம்)" />
          <Button type="submit" className="w-full" disabled={mutation.isPending || statusOptions.length === 0}>
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
            நிலை மாற்றவும்
          </Button>
        </form>

        <form className="space-y-3 rounded-lg border bg-background p-4" onSubmit={submitForm}>
          <input type="hidden" name="action" value="comment" />
          <div className="space-y-1">
            <p className="text-sm font-bold">குறிப்பு சேர்க்கவும்</p>
            <p className="text-sm text-muted-foreground">உடனடி குறிப்புகள் மற்றும் பணித் தகவலை பதிவு செய்யவும்.</p>
          </div>
          <Textarea name="remarks" placeholder="கருத்தை உள்ளிடவும்" required />
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <MessageSquareText className="size-4" />}
            குறிப்பு சேர்க்கவும்
          </Button>
        </form>

        <form className="space-y-3 rounded-lg border bg-background p-4" onSubmit={submitForm}>
          <input type="hidden" name="action" value="media" />
          <div className="space-y-1">
            <p className="text-sm font-bold">முன் / பின் படங்களை பதிவேற்றவும்</p>
            <p className="text-sm text-muted-foreground">அதிகபட்சம் 6 படங்கள் வரை, ஒவ்வொரு படமும் 10MB-க்கு உட்பட்டு.</p>
          </div>
          <div className="space-y-2">
            <label htmlFor="media_stage" className="text-sm font-semibold">
              வகை
            </label>
            <select id="media_stage" name="media_stage" required className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="BEFORE">Before</option>
              <option value="AFTER">After</option>
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="image_files" className="text-sm font-semibold">
              படங்கள்
            </label>
            <Input id="image_files" name="image_files" type="file" accept="image/*" multiple required />
          </div>
          <Input name="caption" placeholder="விளக்கம் (விருப்பம்)" />
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
            படங்களை பதிவேற்றவும்
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
