"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReturnAssetButton({ allocationId, assetId }: { allocationId: string; assetId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [condition, setCondition] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    const fullNote = condition ? `Condition: ${condition}. ${note}`.trim() : note;
    await fetch("/api/return", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ allocationId, assetId, conditionNote: fullNote }),
    });
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded border border-border px-3 py-1 text-xs">
        Mark Returned
      </button>

      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40">
          <div className="w-96 rounded-lg border border-border bg-paper-raised p-5">
            <h2 className="font-display text-lg font-bold">Confirm return</h2>
            <label className="mt-3 block text-sm text-ink-soft">Condition on return</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="mt-1 w-full rounded border border-border px-3 py-2"
            >
              <option value="">Select (optional)</option>
              <option>New</option>
              <option>Good</option>
              <option>Fair</option>
              <option>Poor</option>
              <option>Damaged</option>
            </select>
            <label className="mt-3 block text-sm text-ink-soft">Check-in note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded border border-border px-3 py-2"
              placeholder="Anything worth noting about the asset's condition..."
            />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="rounded border border-border px-3 py-2">
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="rounded bg-teal px-3 py-2 text-white disabled:opacity-50"
              >
                {loading ? "Returning..." : "Confirm Return"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
