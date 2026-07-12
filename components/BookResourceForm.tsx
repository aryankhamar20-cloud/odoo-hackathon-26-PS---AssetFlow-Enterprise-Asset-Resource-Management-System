"use client";
// CORE — Book -> overlap blocked -> OverlapModal with the exact conflicting
// time range. Keep this wiring intact.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { OverlapModal } from "./OverlapModal";

export function BookResourceForm({
  assets,
  employeeId,
}: {
  assets: { id: string; name: string; asset_tag: string }[];
  employeeId: string | null;
}) {
  const router = useRouter();
  const [assetId, setAssetId] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [overlap, setOverlap] = useState<{ start: string; end: string; name?: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBook() {
    if (!assetId || !start || !end || !employeeId) return;
    setError(null);
    if (new Date(end) <= new Date(start)) {
      setError("End time must be after start time.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resourceAssetId: assetId,
        startTime: new Date(start).toISOString(),
        endTime: new Date(end).toISOString(),
      }),
    });
    const result = await res.json();
    setSubmitting(false);

    if (res.ok && !result.blocked) {
      setStart("");
      setEnd("");
      router.refresh();
      return;
    }

    if (res.status === 401) {
      setError("Your session expired — log in again to book.");
      return;
    }

    const c = result.conflictingBooking;
    if (c) {
      setOverlap({ start: c.start_time, end: c.end_time, name: c.bookedByName });
    }
  }

  return (
    <div className="rounded-lg border border-border bg-paper-raised p-4">
      <h3 className="font-display font-bold mb-2">Book a resource</h3>
      <div className="flex flex-wrap items-end gap-2">
        <select value={assetId} onChange={(e) => setAssetId(e.target.value)} className="rounded border border-border px-3 py-2">
          <option value="">Choose resource</option>
          {assets.map((a) => (
            <option key={a.id} value={a.id}>{a.name} ({a.asset_tag})</option>
          ))}
        </select>
        <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="rounded border border-border px-3 py-2" />
        <span className="text-ink-soft">to</span>
        <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className="rounded border border-border px-3 py-2" />
        <button
          onClick={handleBook}
          disabled={!assetId || !start || !end || submitting || !employeeId}
          className="rounded bg-teal px-4 py-2 text-white disabled:opacity-50"
        >
          {submitting ? "Booking..." : "Book"}
        </button>
      </div>
      {!employeeId && <p className="mt-2 text-sm text-status-lost">Log in to book a resource.</p>}
      {error && <p className="mt-2 text-sm text-status-lost">{error}</p>}

      {overlap && (
        <OverlapModal
          conflictStart={overlap.start}
          conflictEnd={overlap.end}
          conflictWithName={overlap.name}
          onClose={() => setOverlap(null)}
        />
      )}
    </div>
  );
}
