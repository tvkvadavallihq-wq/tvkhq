"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, FileImage, FileVideo2, Loader2, LocateFixed, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentLocation } from "@/hooks/use-current-location";
import { COMPLAINT_UPLOAD_LIMITS } from "@/lib/constants";
import { complaintSchema, type ComplaintFormValues } from "@/lib/validators";

type Option = { id: string; name_ta: string };
type WardOption = { id: string; ward_number: number };
type AreaOption = { id: string; ward_id: string | null; ward_number: number | null; area_name: string };

type UploadFileListProps = {
  files: File[];
  label: string;
  onRemove: (index: number) => void;
};

function firstErrorMessage(error: unknown) {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const maybeError = error as { message?: unknown; [key: number]: { message?: unknown } };
  if (typeof maybeError.message === "string") {
    return maybeError.message;
  }

  for (const key of Object.keys(maybeError)) {
    const nested = maybeError[Number(key)];
    if (nested && typeof nested.message === "string") {
      return nested.message;
    }
  }

  return undefined;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  return `${(kb / 1024).toFixed(1)} MB`;
}

function UploadFileList({ files, label, onRemove }: UploadFileListProps) {
  if (files.length === 0) {
    return <p className="text-sm text-muted-foreground">{label} சேர்க்கப்படவில்லை.</p>;
  }

  return (
    <div className="space-y-2">
      {files.map((file, index) => (
        <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-md border bg-background px-2 py-1 text-xs font-semibold"
            onClick={() => onRemove(index)}
          >
            நீக்கு
          </button>
        </div>
      ))}
    </div>
  );
}

function ComplaintCitizenSection({
  register,
  errors,
}: {
  register: ReturnType<typeof useForm<ComplaintFormValues>>["register"];
  errors: ReturnType<typeof useForm<ComplaintFormValues>>["formState"]["errors"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Citizen Details</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5 md:grid-cols-2">
        <Field id="complainant_name" label="Name" error={errors.complainant_name?.message}>
          <Input id="complainant_name" autoComplete="name" {...register("complainant_name")} />
        </Field>
        <Field id="complainant_phone" label="Mobile Number" error={errors.complainant_phone?.message}>
          <Input id="complainant_phone" inputMode="numeric" autoComplete="tel" {...register("complainant_phone")} />
        </Field>
      </CardContent>
    </Card>
  );
}

function ComplaintLocationSection({
  register,
  errors,
  wards,
  areas,
  requestCurrentLocation,
  isLocating,
  locationError,
  setValue,
  selectedWardId,
}: {
  register: ReturnType<typeof useForm<ComplaintFormValues>>["register"];
  errors: ReturnType<typeof useForm<ComplaintFormValues>>["formState"]["errors"];
  wards: WardOption[];
  areas: AreaOption[];
  requestCurrentLocation: () => Promise<{ latitude: number; longitude: number } | null>;
  isLocating: boolean;
  locationError: string | null;
  setValue: ReturnType<typeof useForm<ComplaintFormValues>>["setValue"];
  selectedWardId: string;
}) {
  const visibleAreas = areas.filter((area) => !selectedWardId || area.ward_id === selectedWardId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Location</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <Field id="ward_id" label="Ward" error={errors.ward_id?.message}>
            <select id="ward_id" className="h-10 w-full rounded-md border bg-background px-3 text-sm" {...register("ward_id")}>
              <option value="">Select ward</option>
              {wards.map((ward) => (
                <option key={ward.id} value={ward.id}>
                  வார்டு {ward.ward_number}
                </option>
              ))}
            </select>
          </Field>
          <Field id="area_name" label="Area" error={errors.area_name?.message}>
            <select id="area_name" className="h-10 w-full rounded-md border bg-background px-3 text-sm" {...register("area_name")}>
              <option value="">Select area</option>
              {visibleAreas.map((area) => (
                <option key={area.id} value={area.area_name}>
                  {area.ward_number ? `வார்டு ${area.ward_number} · ` : ""}
                  {area.area_name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field id="address" label="Address" error={errors.address?.message}>
          <Textarea id="address" {...register("address")} />
        </Field>

        <div className="grid gap-5 md:grid-cols-2">
          <Field id="gps_latitude" label="GPS Latitude" error={errors.gps_latitude?.message}>
            <Input id="gps_latitude" inputMode="decimal" placeholder="11.0123456" {...register("gps_latitude")} />
          </Field>
          <Field id="gps_longitude" label="GPS Longitude" error={errors.gps_longitude?.message}>
            <Input id="gps_longitude" inputMode="decimal" placeholder="76.1234567" {...register("gps_longitude")} />
          </Field>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              const location = await requestCurrentLocation();
              if (!location) {
                return;
              }

              setValue("gps_latitude", location.latitude, { shouldValidate: true, shouldDirty: true });
              setValue("gps_longitude", location.longitude, { shouldValidate: true, shouldDirty: true });
            }}
            disabled={isLocating}
          >
            {isLocating ? <Loader2 className="size-4 animate-spin" /> : <LocateFixed className="size-4" />}
            GPS பெறுக
          </Button>
          {locationError ? <p className="text-sm font-medium text-destructive">{locationError}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

function ComplaintDetailsSection({
  register,
  errors,
  categories,
}: {
  register: ReturnType<typeof useForm<ComplaintFormValues>>["register"];
  errors: ReturnType<typeof useForm<ComplaintFormValues>>["formState"]["errors"];
  categories: Option[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Complaint</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <Field id="category_id" label="Category" error={errors.category_id?.message}>
          <select id="category_id" className="h-10 w-full rounded-md border bg-background px-3 text-sm" {...register("category_id")}>
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name_ta}
              </option>
            ))}
          </select>
        </Field>
        <Field id="description" label="Description" error={errors.description?.message}>
          <Textarea id="description" {...register("description")} />
        </Field>
      </CardContent>
    </Card>
  );
}

function ComplaintMediaSection({
  errors,
  imageFiles,
  videoFiles,
  setImageFiles,
  setVideoFiles,
}: {
  errors: ReturnType<typeof useForm<ComplaintFormValues>>["formState"]["errors"];
  imageFiles: File[];
  videoFiles: File[];
  setImageFiles: (files: File[]) => void;
  setVideoFiles: (files: File[]) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Media</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3">
          <label htmlFor="image_files" className="flex items-center gap-2 text-sm font-semibold">
            <FileImage className="size-4" />
            Upload Images
          </label>
          <Input
            id="image_files"
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => {
              setImageFiles(Array.from(event.target.files ?? []));
            }}
          />
          <p className="text-xs text-muted-foreground">
            Max {COMPLAINT_UPLOAD_LIMITS.maxImages} images, each up to {Math.round(COMPLAINT_UPLOAD_LIMITS.maxImageSizeBytes / 1024 / 1024)}MB.
          </p>
          {firstErrorMessage(errors.image_files) ? (
            <p className="text-sm font-medium text-destructive">{firstErrorMessage(errors.image_files)}</p>
          ) : null}
          <UploadFileList
            files={imageFiles}
            label="படங்கள்"
            onRemove={(index) => setImageFiles(imageFiles.filter((_, fileIndex) => fileIndex !== index))}
          />
        </div>

        <div className="space-y-3">
          <label htmlFor="video_files" className="flex items-center gap-2 text-sm font-semibold">
            <FileVideo2 className="size-4" />
            Upload Videos
          </label>
          <Input
            id="video_files"
            type="file"
            accept="video/*"
            multiple
            onChange={(event) => {
              setVideoFiles(Array.from(event.target.files ?? []));
            }}
          />
          <p className="text-xs text-muted-foreground">
            Max {COMPLAINT_UPLOAD_LIMITS.maxVideos} videos, each up to {Math.round(COMPLAINT_UPLOAD_LIMITS.maxVideoSizeBytes / 1024 / 1024)}MB.
          </p>
          {firstErrorMessage(errors.video_files) ? (
            <p className="text-sm font-medium text-destructive">{firstErrorMessage(errors.video_files)}</p>
          ) : null}
          <UploadFileList
            files={videoFiles}
            label="வீடியோக்கள்"
            onRemove={(index) => setVideoFiles(videoFiles.filter((_, fileIndex) => fileIndex !== index))}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function ComplaintForm({ wards, categories, areas }: { wards: WardOption[]; categories: Option[]; areas: AreaOption[] }) {
  const router = useRouter();
  const location = useCurrentLocation();
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ComplaintFormValues>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      gps_latitude: undefined,
      gps_longitude: undefined,
      image_files: [],
      video_files: [],
    },
  });

  useEffect(() => {
    setValue("image_files", imageFiles, { shouldValidate: true, shouldDirty: true });
  }, [imageFiles, setValue]);

  useEffect(() => {
    setValue("video_files", videoFiles, { shouldValidate: true, shouldDirty: true });
  }, [setValue, videoFiles]);

  const selectedCategoryId = watch("category_id");
  const selectedWardId = watch("ward_id");
  const selectedAreaName = watch("area_name");
  const selectedCategory = categories.find((item) => item.id === selectedCategoryId);
  const complaintSummary = selectedCategory ? `${selectedCategory.name_ta} - ${selectedAreaName ?? ""}`.trim() : "";

  useEffect(() => {
    if (!selectedWardId || !selectedAreaName) {
      return;
    }

    const areaStillValid = areas.some((area) => area.ward_id === selectedWardId && area.area_name === selectedAreaName);
    if (!areaStillValid) {
      setValue("area_name", "", { shouldValidate: true, shouldDirty: true });
    }
  }, [areas, selectedAreaName, selectedWardId, setValue]);

  const mutation = useMutation({
    mutationFn: async (values: ComplaintFormValues) => {
      const formData = new FormData();
      formData.set("complainant_name", values.complainant_name);
      formData.set("complainant_phone", values.complainant_phone);
      formData.set("ward_id", values.ward_id);
      formData.set("area_name", values.area_name);
      formData.set("address", values.address);
      formData.set("gps_latitude", String(values.gps_latitude));
      formData.set("gps_longitude", String(values.gps_longitude));
      formData.set("category_id", values.category_id);
      formData.set("description", values.description);
      (values.image_files ?? []).forEach((file) => formData.append("image_files", file));
      (values.video_files ?? []).forEach((file) => formData.append("video_files", file));

      const response = await fetch("/api/complaints/register", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as
        | { ok: true; trackingId: string }
        | { ok: false; error: string };

      if (!response.ok || !payload.ok) {
        throw new Error(!payload.ok ? payload.error : "புகார் பதிவில் சிக்கல் ஏற்பட்டது.");
      }

      return payload.trackingId;
    },
    onSuccess(trackingId) {
      reset();
      setImageFiles([]);
      setVideoFiles([]);
      router.push(`/complaint/success/${trackingId}`);
    },
  });

  return (
    <div className="space-y-5">
      <Card className="border-dashed">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Complaint Preview</p>
            <p className="text-lg font-black">{complaintSummary || "TVK-CBE-YYYY-XXXXXX"}</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-2 text-sm font-bold text-primary">
            <RotateCcw className="size-4" />
            Live validation
          </div>
        </CardContent>
      </Card>

      <form
        className="grid gap-5"
        onSubmit={handleSubmit((values) =>
          mutation.mutate({ ...values, image_files: imageFiles, video_files: videoFiles } as ComplaintFormValues),
        )}
      >
        <ComplaintCitizenSection register={register} errors={errors} />
        <ComplaintLocationSection
          register={register}
          errors={errors}
          wards={wards}
          areas={areas}
          requestCurrentLocation={location.requestLocation}
          isLocating={location.isLocating}
          locationError={location.locationError}
          setValue={setValue}
          selectedWardId={selectedWardId}
        />
        <ComplaintDetailsSection register={register} errors={errors} categories={categories} />
        <ComplaintMediaSection
          errors={errors}
          imageFiles={imageFiles}
          videoFiles={videoFiles}
          setImageFiles={setImageFiles}
          setVideoFiles={setVideoFiles}
        />

        {mutation.error ? <p className="text-sm font-semibold text-destructive">{mutation.error.message}</p> : null}

        <Button type="submit" size="lg" disabled={isSubmitting || mutation.isPending}>
          {isSubmitting || mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
          புகார் சமர்ப்பிக்க
        </Button>
      </form>
    </div>
  );
}
