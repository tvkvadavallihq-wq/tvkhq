import { ComplaintStatus, UserRole } from "@/lib/enums";

export const APP_NAME = "TVK Vadavalli HQ";
export const APP_NAME_TAMIL = "தவெக வடவள்ளி தலைமையகம்";
export const STORAGE_BUCKETS = {
  complaintMedia: process.env.NEXT_PUBLIC_STORAGE_BUCKET ?? "complaint-media",
} as const;

export const COMPLAINT_UPLOAD_LIMITS = {
  maxImages: 6,
  maxVideos: 3,
  maxImageSizeBytes: 10 * 1024 * 1024,
  maxVideoSizeBytes: 50 * 1024 * 1024,
} as const;

export const COMPLAINT_STATUS_OPTIONS = Object.values(ComplaintStatus);
export const USER_ROLE_OPTIONS = Object.values(UserRole);

export const NAV_ITEMS = [
  { href: "/", label: "முகப்பு" },
  { href: "/complaint/new", label: "புகார் பதிவு" },
  { href: "/complaints", label: "புகார்கள்" },
  { href: "/track", label: "நிலை அறிய" },
] as const;

export const ADMIN_NAV_ITEMS = [
  { href: "/admin/dashboard", label: "நிர்வாக பலகை" },
] as const;
