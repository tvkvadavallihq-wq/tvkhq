import { isSupabaseConfigured } from "@/lib/env";
import { ComplaintStatus, UserRole } from "@/lib/enums";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/admin-session";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { cookies } from "next/headers";
import { getWardNumber } from "@/lib/ward-utils";

export type AdminProfile = {
  id: string;
  username?: string | null;
  full_name: string;
  phone: string | null;
  role: UserRole;
  ward_id: string | null;
  ward_number?: number | null;
};

export type AdminComplaintRow = {
  id: string;
  tracking_id: string;
  title: string;
  address: string;
  status: ComplaintStatus;
  priority: number;
  created_at: string;
  ward_number: number | null;
  category_name_ta: string | null;
};

export type AdminMetricCard = {
  label: string;
  value: number;
  tone: "primary" | "secondary" | "success" | "warning";
};

export type AdminChartDatum = {
  label: string;
  value: number;
};

export type AdminDashboardResult = {
  user: { id: string; username?: string | null } | null;
  profile: AdminProfile | null;
  metrics: {
    total: number;
    pending: number;
    assigned: number;
    resolved: number;
  };
  complaintsByWard: AdminChartDatum[];
  complaintsByCategory: AdminChartDatum[];
  resolutionTime: AdminChartDatum[];
  recentComplaints: AdminComplaintRow[];
};

function getServiceClient(): any {
  return createSupabaseServiceClient() as any;
}

function getScopedComplaintFilter(profile: AdminProfile | null) {
  if (!profile) {
    return null;
  }

  if (profile.role === UserRole.SUPER_ADMIN) {
    return null;
  }

  return profile.ward_id ?? "00000000-0000-0000-0000-000000000000";
}

function resolveStatus(status: string) {
  return status === ComplaintStatus.RESOLVED || status === ComplaintStatus.CLOSED;
}

function buildResolutionBucket(days: number) {
  if (days <= 1) return "< 1 day";
  if (days <= 3) return "1-3 days";
  if (days <= 7) return "4-7 days";
  return "8+ days";
}

export async function getAdminSession() {
  if (!isSupabaseConfigured()) {
    return { user: null, profile: null };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value ?? null;
  const userId = await verifyAdminSessionToken(token);

  if (!userId) {
    return { user: null, profile: null };
  }

  const service = getServiceClient();
  const { data: profile } = await service
    .from("users")
    .select("*")
    .eq("id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (!profile) {
    return { user: null, profile: null };
  }

  let wardNumber: number | null = null;
  if (profile.ward_id) {
    const { data: ward } = await service.from("wards").select("id,*").eq("id", profile.ward_id).maybeSingle();
    wardNumber = getWardNumber(ward) ?? null;
  }

  return {
    user: { id: userId, username: (profile as { username?: string | null } | null)?.username ?? null },
    profile: {
      ...(profile as AdminProfile),
      full_name:
        (profile as { full_name?: string | null; name?: string | null; username?: string | null } | null)?.full_name ??
        (profile as { name?: string | null; username?: string | null } | null)?.name ??
        (profile as { username?: string | null } | null)?.username ??
        "Admin",
      ward_number: wardNumber,
    },
  };
}

export async function getAdminDashboard(): Promise<AdminDashboardResult> {
  if (!isSupabaseConfigured()) {
    return {
      user: null,
      profile: null,
      metrics: { total: 0, pending: 0, assigned: 0, resolved: 0 },
      complaintsByWard: [],
      complaintsByCategory: [],
      resolutionTime: [],
      recentComplaints: [],
    };
  }

  const session = await getAdminSession();
  if (!session.user || !session.profile) {
    return {
      user: null,
      profile: null,
      metrics: { total: 0, pending: 0, assigned: 0, resolved: 0 },
      complaintsByWard: [],
      complaintsByCategory: [],
      resolutionTime: [],
      recentComplaints: [],
    };
  }

  const service = getServiceClient();
  const wardScope = getScopedComplaintFilter(session.profile);
  const applyScope = (query: any) => {
    if (wardScope) {
      return query.eq("ward_id", wardScope);
    }

    return query;
  };

  const complaintListQuery = () =>
    applyScope(
      service
        .from("complaints")
        .select(
          "id,complaint_number,title,address,current_status,priority,created_at,updated_at,ward_id,category_id,wards(*),complaint_categories(name_ta)",
        )
        .order("created_at", { ascending: false }),
    );

  const complaintCountQuery = () => applyScope(service.from("complaints").select("id", { count: "exact", head: true }));

  const [totalResult, pendingResult, assignedResult, resolvedResult, complaintsResult] = await Promise.all([
    complaintCountQuery(),
    complaintCountQuery()
      .select("id", { count: "exact", head: true })
      .in("current_status", [ComplaintStatus.NEW, ComplaintStatus.VERIFIED, ComplaintStatus.IN_PROGRESS, ComplaintStatus.WAITING_GOVT]),
    complaintCountQuery().eq("current_status", ComplaintStatus.ASSIGNED),
    complaintCountQuery().in("current_status", [ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED]),
    complaintListQuery().limit(500),
  ]);

  const complaints = (complaintsResult.data ?? []) as any[];

  const wardCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  const resolutionBuckets = new Map<string, number>([
    ["< 1 day", 0],
    ["1-3 days", 0],
    ["4-7 days", 0],
    ["8+ days", 0],
  ]);

  complaints.forEach((complaint) => {
    const wardRelation = Array.isArray(complaint.wards) ? complaint.wards[0] ?? null : complaint.wards ?? null;
    const categoryRelation = Array.isArray(complaint.complaint_categories)
      ? complaint.complaint_categories[0] ?? null
      : complaint.complaint_categories ?? null;

    const wardLabel = getWardNumber(wardRelation) !== null ? `Ward ${getWardNumber(wardRelation)}` : "Unassigned";
    wardCounts.set(wardLabel, (wardCounts.get(wardLabel) ?? 0) + 1);

    const categoryLabel = categoryRelation?.name_ta ?? "Uncategorized";
    categoryCounts.set(categoryLabel, (categoryCounts.get(categoryLabel) ?? 0) + 1);

    if (resolveStatus(complaint.current_status)) {
      const created = new Date(complaint.created_at).getTime();
      const updated = new Date(complaint.updated_at).getTime();
      const diffDays = Math.max(0, Math.ceil((updated - created) / (1000 * 60 * 60 * 24)));
      const bucket = buildResolutionBucket(diffDays);
      resolutionBuckets.set(bucket, (resolutionBuckets.get(bucket) ?? 0) + 1);
    }
  });

  const byWard = Array.from(wardCounts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
  const byCategory = Array.from(categoryCounts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
  const resolutionTime = Array.from(resolutionBuckets.entries()).map(([label, value]) => ({ label, value }));

  const recentComplaints = complaints.slice(0, 8).map((complaint) => {
    const wardRelation = Array.isArray(complaint.wards) ? complaint.wards[0] ?? null : complaint.wards ?? null;
    const categoryRelation = Array.isArray(complaint.complaint_categories)
      ? complaint.complaint_categories[0] ?? null
      : complaint.complaint_categories ?? null;

    return {
      id: complaint.id,
      tracking_id: complaint.complaint_number,
      title: complaint.title,
      address: complaint.address,
      status: complaint.current_status,
      priority: complaint.priority,
      created_at: complaint.created_at,
      ward_number: getWardNumber(wardRelation) ?? null,
      category_name_ta: categoryRelation?.name_ta ?? null,
    };
  });

  return {
    user: session.user,
    profile: session.profile,
    metrics: {
      total: totalResult.count ?? 0,
      pending: pendingResult.count ?? 0,
      assigned: assignedResult.count ?? 0,
      resolved: resolvedResult.count ?? 0,
    },
    complaintsByWard: byWard,
    complaintsByCategory: byCategory,
    resolutionTime,
    recentComplaints,
  };
}
