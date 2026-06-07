import { ComplaintStatus, complaintStatusTamil } from "@/lib/enums";
import { cn } from "@/lib/utils";

const STEPS: ComplaintStatus[] = [
  ComplaintStatus.NEW,
  ComplaintStatus.VERIFIED,
  ComplaintStatus.ASSIGNED,
  ComplaintStatus.IN_PROGRESS,
  ComplaintStatus.RESOLVED,
];

export function ComplaintTimeline({ currentStatus }: { currentStatus: ComplaintStatus }) {
  const currentIndex = Math.max(
    STEPS.findIndex((step) => step === currentStatus),
    currentStatus === ComplaintStatus.CLOSED ? STEPS.length - 1 : -1,
  );

  return (
    <div className="grid gap-2 sm:grid-cols-[repeat(5,minmax(0,1fr))] sm:items-start">
      {STEPS.map((step, index) => {
        const isComplete = currentIndex >= index;
        const isCurrent = currentIndex === index;

        return (
          <div key={step} className="flex items-center gap-3 sm:block">
            <div
              className={cn(
                "flex size-9 items-center justify-center rounded-full border text-xs font-black",
                isCurrent
                  ? "border-primary bg-primary text-primary-foreground"
                  : isComplete
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                    : "border-muted-foreground/30 bg-background text-muted-foreground",
              )}
            >
              {index + 1}
            </div>
            <div className="min-w-0 sm:mt-3">
              <p className={cn("text-sm font-bold", isComplete ? "text-foreground" : "text-muted-foreground")}>
                {complaintStatusTamil[step]}
              </p>
              {index < STEPS.length - 1 ? <div className="hidden h-px bg-border sm:mt-4 sm:block" /> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
