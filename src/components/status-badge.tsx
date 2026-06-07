import { complaintStatusTamil } from "@/lib/enums";
import type { ComplaintStatus } from "@/lib/enums";
import { cn } from "@/lib/utils";

const statusClass: Record<ComplaintStatus, string> = {
  NEW: "bg-blue-50 text-blue-800 border-blue-200",
  VERIFIED: "bg-cyan-50 text-cyan-800 border-cyan-200",
  ASSIGNED: "bg-indigo-50 text-indigo-800 border-indigo-200",
  IN_PROGRESS: "bg-amber-50 text-amber-900 border-amber-200",
  WAITING_GOVT: "bg-orange-50 text-orange-900 border-orange-200",
  RESOLVED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  CLOSED: "bg-neutral-100 text-neutral-800 border-neutral-200",
  REJECTED: "bg-red-50 text-red-800 border-red-200",
};

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-bold", statusClass[status])}>
      {complaintStatusTamil[status]}
    </span>
  );
}
