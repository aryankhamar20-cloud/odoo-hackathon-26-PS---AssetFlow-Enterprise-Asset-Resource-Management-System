"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { OverlapModal } from "./OverlapModal";

export function RescheduleBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [overlap, setOverlap] = useState<{ start: string; end: string; name?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!start || !end) return;
    if (new Date(end) <= new Date(start)) {
      setError("End time must be after start time.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/book/reschedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId,
        startTime: new Date(start).toISOString(),
        endTime: new Date(end).toISOString(),
      }),
    });
    const result = await res.json();
    setSubmitting(false);

    if (res.ok && !result.blocked) {
      setEditing(false);
      router.refresh();
      return;
    }
    if (res.status === 403 || res.status === 401) {
      setError(result.message ?? "Not allowed.");
      return;
    }
    const c = result.conflictingBooking;
    if (c) {
      setOverlap({ start: c.start_time, end: c.end_time, name: c.bookedByName });
    }
  }

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)} className="rounded border border-border px-3 py-1 text-xs">
        Reschedule
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="rounded border border-border px-2 py-1 text-xs" />
        <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className="rounded border border-border px-2 py-1 text-xs" />
        <button onClick={handleSave} disabled={submitting} className="rounded bg-teal px-2 py-1 text-xs text-white disabled:opacity-50">
          {submitting ? "Saving..." : "Save"}
        </button>
        <button onClick={() => setEditing(false)} className="rounded border border-border px-2 py-1 text-xs">
          Cancel
        </button>
      </div>
      {error && <p className="text-xs text-status-lost">{error}</p>}
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
