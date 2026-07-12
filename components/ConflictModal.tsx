// NEVER CUT — this is one of the three components the design doc calls
// out as making the demo convincing.
export function ConflictModal({
  holderName,
  onRequestTransfer,
  onClose,
}: {
  holderName: string;
  onRequestTransfer: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40">
      <div className="w-96 rounded-lg border-2 border-status-lost bg-paper-raised p-5">
        <h2 className="font-display text-lg font-bold text-status-lost">Allocation blocked</h2>
        <p className="mt-2 text-ink-soft">Currently held by {holderName}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded border border-border px-3 py-2">
            Cancel
          </button>
          <button
            onClick={onRequestTransfer}
            className="rounded bg-teal px-3 py-2 text-white"
          >
            Request Transfer
          </button>
        </div>
      </div>
    </div>
  );
}
