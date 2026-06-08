import { ComplaintStatus, UserRole } from "@/lib/enums";

export const APP_NAME = "TVK Vadavalli HQ";
export const APP_NAME_TAMIL = "தவெக வடவள்ளி தலைமையகம்";
export const OFFICE_CONTACT = {
  name: "TVK மக்கள் தொடர்பு அலுவலகம்",
  addressLines: ["கூத்தாண்டவர் கோயில் வீதி", "வடவள்ளி பகுதி", "கோவை வடக்கு சட்டமன்ற தொகுதி"],
  phone: "90431 69669",
  email: "tvkvadavallihq@gmail.com",
  hours: "காலை 9 மணி முதல் இரவு 9 மணி வரை",
} as const;
export const STORAGE_BUCKETS = {
  complaintMedia: process.env.NEXT_PUBLIC_STORAGE_BUCKET ?? "complaint_media",
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
