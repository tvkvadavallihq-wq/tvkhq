import { Bell, Database, Gauge, Home, ListChecks, Search } from "lucide-react";
import { UserRole } from "@/lib/enums";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: typeof Gauge;
};

export function getAdminNavItems(role?: UserRole | null) {
  const base: AdminNavItem[] = [{ href: "/admin/dashboard", label: "நிர்வாக பலகை", icon: Gauge }];

  if (role === UserRole.SUPER_ADMIN) {
    return [
      ...base,
      { href: "/admin/complaints", label: "புகார் மேலாண்மை", icon: ListChecks },
      { href: "/admin/masters", label: "மாஸ்டர் தரவு", icon: Database },
      { href: "/track", label: "புகார் நிலை", icon: Search },
      { href: "/complaint/new", label: "பொது பதிவு", icon: Bell },
      { href: "/", label: "பொது முகப்பு", icon: Home },
    ];
  }

  if (role === UserRole.WARD_SECRETARY) {
    return [
      ...base,
      { href: "/admin/complaints", label: "வார்டு புகார்கள்", icon: ListChecks },
      { href: "/track", label: "புகார் நிலை", icon: Search },
      { href: "/", label: "பொது முகப்பு", icon: Home },
    ];
  }

  if (role === UserRole.AREA_COORDINATOR) {
    return [
      ...base,
      { href: "/admin/complaints", label: "பகுதி புகார்கள்", icon: ListChecks },
      { href: "/track", label: "புகார் நிலை", icon: Search },
      { href: "/", label: "பொது முகப்பு", icon: Home },
    ];
  }

  return [
    ...base,
    { href: "/track", label: "புகார் நிலை", icon: Search },
    { href: "/complaint/new", label: "பொது பதிவு", icon: Bell },
    { href: "/", label: "பொது முகப்பு", icon: Home },
  ];
}
