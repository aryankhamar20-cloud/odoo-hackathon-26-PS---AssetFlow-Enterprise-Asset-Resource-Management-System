// NEVER CUT — shows the exact conflicting time range, per copy rules.
export function OverlapModal({
  conflictStart,
  conflictEnd,
  conflictWithName,
  onClose,
}: {
  conflictStart: string;
  conflictEnd: string;
  conflictWithName?: string;
  onClose: () => void;
}) {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40">
      <div className="w-96 rounded-lg border-2 border-status-reserved bg-paper-raised p-5">
        <h2 className="font-display text-lg font-bold text-status-reserved">Booking overlap</h2>
        <p className="mt-2 text-ink-soft">
          Overlaps with {fmt(conflictStart)}–{fmt(conflictEnd)}
          {conflictWithName ? ` (${conflictWithName})` : ""}
        </p>
        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="rounded bg-teal px-3 py-2 text-white">
            Choose another time
          </button>
        </div>
      </div>
    </div>
  );
}
