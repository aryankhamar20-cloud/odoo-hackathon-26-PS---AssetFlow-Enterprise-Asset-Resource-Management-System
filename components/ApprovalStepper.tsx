// NEVER CUT — the design doc calls this out explicitly alongside
// ConflictModal/OverlapModal/StatusChip as core to a convincing demo.
const STEPS = ["Pending", "Approved", "Technician Assigned", "In Progress", "Resolved"] as const;

export function ApprovalStepper({ status }: { status: string }) {
  if (status === "Rejected") {
    return (
      <span className="inline-flex items-center rounded-full border border-status-lost px-3 py-1 text-xs text-status-lost">
        Rejected
      </span>
    );
  }

  const currentIndex = STEPS.indexOf(status as (typeof STEPS)[number]);

  return (
    <div className="flex items-center">
      {STEPS.map((step, i) => {
        const filled = i <= currentIndex;
        return (
          <div key={step} className="flex items-center">
            <div
              className={`h-3 w-3 rounded-full ${filled ? "bg-teal" : "border border-border bg-transparent"}`}
              title={step}
            />
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-6 ${i < currentIndex ? "bg-teal" : "bg-border"}`} />
            )}
          </div>
        );
      })}
      <span className="ml-2 text-xs text-ink-soft">{status}</span>
    </div>
  );
}
