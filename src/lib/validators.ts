import { z } from "zod";
import { COMPLAINT_UPLOAD_LIMITS } from "@/lib/constants";
import { ComplaintStatus, UserRole } from "@/lib/enums";

export const fileSchema = z.custom<File>((value): value is File => value instanceof File, "கோப்பு செல்லாது");

export function createFileArraySchema({
  label,
  mimePrefix,
  maxCount,
  maxSizeBytes,
}: {
  label: string;
  mimePrefix: string;
  maxCount: number;
  maxSizeBytes: number;
}) {
  return z
    .array(fileSchema)
    .max(maxCount, `${label} அதிகபட்சம் ${maxCount} கோப்புகள் வரை மட்டும் அனுமதி`)
    .superRefine((files, ctx) => {
      files.forEach((file, index) => {
        if (!file.type.startsWith(mimePrefix)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${label} கோப்பு வகை செல்லாது`,
            path: [index],
          });
        }

        if (file.size > maxSizeBytes) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${label} கோப்பு ${Math.round(maxSizeBytes / 1024 / 1024)}MB-ஐ மீறக்கூடாது`,
            path: [index],
          });
        }
      });
    });
}

export const complaintSchema = z.object({
  complainant_name: z.string().min(2, "பெயரை உள்ளிடவும்").max(120),
  complainant_phone: z.string().regex(/^[6-9]\d{9}$/, "சரியான மொபைல் எண்ணை உள்ளிடவும்"),
  ward_id: z.string().uuid("வார்டை தேர்வு செய்யவும்"),
  category_id: z.string().uuid("வகையை தேர்வு செய்யவும்"),
  area_name: z.string().min(2, "பகுதியை உள்ளிடவும்").max(160),
  address: z.string().min(5, "முகவரியை உள்ளிடவும்").max(500),
  gps_latitude: z.coerce.number().min(-90, "சரியான latitude உள்ளிடவும்").max(90, "சரியான latitude உள்ளிடவும்").nullable().optional(),
  gps_longitude: z.coerce.number().min(-180, "சரியான longitude உள்ளிடவும்").max(180, "சரியான longitude உள்ளிடவும்").nullable().optional(),
  image_files: createFileArraySchema({
    label: "படம்",
    mimePrefix: "image/",
    maxCount: COMPLAINT_UPLOAD_LIMITS.maxImages,
    maxSizeBytes: COMPLAINT_UPLOAD_LIMITS.maxImageSizeBytes,
  }).default([]),
  video_files: createFileArraySchema({
    label: "வீடியோ",
    mimePrefix: "video/",
    maxCount: COMPLAINT_UPLOAD_LIMITS.maxVideos,
    maxSizeBytes: COMPLAINT_UPLOAD_LIMITS.maxVideoSizeBytes,
  }).default([]),
  description: z.string().min(20, "விவரத்தை உள்ளிடவும்").max(3000),
});

export const trackingSchema = z.object({
  tracking_id: z.string().min(8, "புகார் எண்ணை உள்ளிடவும்"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "சரியான மொபைல் எண்ணை உள்ளிடவும்"),
});

export const complaintFiltersSchema = z.object({
  ward: z.string().optional(),
  category: z.string().optional(),
  status: z.nativeEnum(ComplaintStatus).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
});

export const adminComplaintListFiltersSchema = z.object({
  q: z.string().optional(),
  ward: z.string().optional(),
  category: z.string().optional(),
  assignee: z.string().optional(),
  status: z.nativeEnum(ComplaintStatus).optional(),
  sort: z.enum(["created_at", "updated_at", "priority", "current_status"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().positive().default(1),
});

export const adminComplaintAssignmentSchema = z.object({
  assigned_to: z.string().uuid("ஒதுக்க வேண்டிய பயனரைத் தேர்வு செய்யவும்"),
  remarks: z.string().trim().max(2000, "குறிப்பு அதிகபட்சம் 2000 எழுத்துகள்").optional().default(""),
});

export const adminComplaintStatusChangeSchema = z.object({
  status: z.nativeEnum(ComplaintStatus, {
    errorMap: () => ({ message: "சரியான நிலையைத் தேர்வு செய்யவும்" }),
  }),
  remarks: z.string().trim().max(2000, "குறிப்பு அதிகபட்சம் 2000 எழுத்துகள்").optional().default(""),
});

export const adminComplaintCommentSchema = z.object({
  remarks: z.string().trim().min(2, "குறிப்பு உள்ளிடவும்").max(2000, "குறிப்பு அதிகபட்சம் 2000 எழுத்துகள்"),
});

export const adminComplaintMediaUploadSchema = z.object({
  media_stage: z.enum(["BEFORE", "AFTER"], {
    errorMap: () => ({ message: "பதிவேற்ற வகையைத் தேர்வு செய்யவும்" }),
  }),
  caption: z.string().trim().max(180, "விளக்கம் அதிகபட்சம் 180 எழுத்துகள்").optional().default(""),
  image_files: createFileArraySchema({
    label: "புகைப்படம்",
    mimePrefix: "image/",
    maxCount: COMPLAINT_UPLOAD_LIMITS.maxImages,
    maxSizeBytes: COMPLAINT_UPLOAD_LIMITS.maxImageSizeBytes,
  }).default([]),
});

export const adminLoginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username-ஐ உள்ளிடவும்")
    .max(80, "Username அதிகபட்சம் 80 எழுத்துகள்")
    .regex(/^[a-zA-Z0-9._@-]+$/, "சரியான username-ஐ உள்ளிடவும்"),
  password: z.string().min(1, "கடவுச்சொல்லை உள்ளிடவும்"),
});

export const adminUserUpsertSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, "Username-ஐ உள்ளிடவும்")
      .max(80, "Username அதிகபட்சம் 80 எழுத்துகள்")
      .regex(/^[a-zA-Z0-9._@-]+$/, "சரியான username-ஐ உள்ளிடவும்"),
    password: z.string().min(8, "கடவுச்சொல் குறைந்தபட்சம் 8 எழுத்துகள்").optional().or(z.literal("")),
    name: z.string().trim().min(2, "பெயரை உள்ளிடவும்").max(120, "பெயர் அதிகபட்சம் 120 எழுத்துகள்"),
    mobile: z.string().trim().regex(/^[6-9]\d{9}$/, "சரியான மொபைல் எண்ணை உள்ளிடவும்").optional().or(z.literal("")),
    role: z.nativeEnum(UserRole, {
      errorMap: () => ({ message: "சரியான role-ஐ தேர்வு செய்யவும்" }),
    }),
    ward_id: z.string().uuid("சரியான ward-ஐ தேர்வு செய்யவும்").optional().or(z.literal("")),
    is_active: z.coerce.boolean().default(true),
  })
  .superRefine((value, ctx) => {
    const username = value.username?.trim();
    const password = value.password?.trim();

    if (!username) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Username தேவை",
        path: ["username"],
      });
    }

    if (!password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "கடவுச்சொல் தேவை",
        path: ["password"],
      });
    }

    if (value.role !== UserRole.SUPER_ADMIN && !value.ward_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ward தேர்வு செய்யவும்",
        path: ["ward_id"],
      });
    }
  });

export const adminUserToggleSchema = z.object({
  id: z.string().uuid("சரியான பயனரைத் தேர்வு செய்யவும்"),
  is_active: z.coerce.boolean().default(true),
});

export type ComplaintFormValues = z.input<typeof complaintSchema>;
export type ComplaintFormOutput = z.output<typeof complaintSchema>;
export type TrackingFormValues = z.infer<typeof trackingSchema>;
export type ComplaintFiltersValues = z.input<typeof complaintFiltersSchema>;
export type AdminComplaintListFilterValues = z.input<typeof adminComplaintListFiltersSchema>;
export type AdminComplaintAssignmentValues = z.infer<typeof adminComplaintAssignmentSchema>;
export type AdminComplaintStatusChangeValues = z.infer<typeof adminComplaintStatusChangeSchema>;
export type AdminComplaintCommentValues = z.infer<typeof adminComplaintCommentSchema>;
export type AdminComplaintMediaUploadValues = z.infer<typeof adminComplaintMediaUploadSchema>;
export type AdminLoginValues = z.infer<typeof adminLoginSchema>;
export type AdminUserUpsertValues = z.infer<typeof adminUserUpsertSchema>;
export type AdminUserToggleValues = z.infer<typeof adminUserToggleSchema>;
