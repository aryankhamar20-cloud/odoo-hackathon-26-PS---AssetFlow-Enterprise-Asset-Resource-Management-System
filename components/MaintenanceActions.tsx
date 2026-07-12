"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function MaintenanceActions({
  requestId,
  status,
  approverEmployeeId,
  canManage,
}: {
  requestId: string;
  status: string;
  approverEmployeeId: string | null;
  canManage: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [technicianName, setTechnicianName] = useState("");

  async function post(url: string, body: Record<string, unknown>) {
    setLoading(true);
    setError(null);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (!res.ok) {
      const result = await res.json().catch(() => ({}));
      setError(result.error ?? "That action wasn't allowed.");
      return;
    }
    router.refresh();
  }

  if (!approverEmployeeId && status === "Pending") {
    return <span className="text-xs text-ink-soft">Log in to act on this request.</span>;
  }

  if (status === "Pending") {
    if (!canManage) {
      return <span className="text-xs text-ink-soft">Waiting on Asset Manager approval.</span>;
    }
    return (
      <div>
        <div className="flex gap-2">
          <button
            disabled={loading}
            onClick={() => post("/api/maintenance/approve", { requestId })}
            className="rounded bg-teal px-3 py-1 text-xs text-white disabled:opacity-50"
          >
            Approve
          </button>
          <button
            disabled={loading}
            onClick={() => post("/api/maintenance/reject", { requestId })}
            className="rounded border border-border px-3 py-1 text-xs disabled:opacity-50"
          >
            Reject
          </button>
        </div>
        {error && <p className="mt-1 text-xs text-status-lost">{error}</p>}
      </div>
    );
  }

  if (status === "Approved") {
    if (!assigning) {
      return (
        <button
          disabled={loading}
          onClick={() => setAssigning(true)}
          className="rounded bg-teal px-3 py-1 text-xs text-white disabled:opacity-50"
        >
          Assign Technician
        </button>
      );
    }
    return (
      <div className="flex items-center gap-1">
        <input
          value={technicianName}
          onChange={(e) => setTechnicianName(e.target.value)}
          placeholder="Technician name"
          className="rounded border border-border px-2 py-1 text-xs"
        />
        <button
          disabled={loading || !technicianName.trim()}
          onClick={() => post("/api/maintenance/assign-technician", { requestId, technicianName: technicianName.trim() })}
          className="rounded bg-teal px-2 py-1 text-xs text-white disabled:opacity-50"
        >
          Save
        </button>
        <button onClick={() => setAssigning(false)} className="rounded border border-border px-2 py-1 text-xs">
          Cancel
        </button>
      </div>
    );
  }

  if (status === "Technician Assigned") {
    return (
      <button
        disabled={loading}
        onClick={() => post("/api/maintenance/start-progress", { requestId })}
        className="rounded bg-teal px-3 py-1 text-xs text-white disabled:opacity-50"
      >
        Start Progress
      </button>
    );
  }

  if (status === "In Progress") {
    return (
      <button
        disabled={loading}
        onClick={() => post("/api/maintenance/resolve", { requestId })}
        className="rounded bg-status-available px-3 py-1 text-xs text-white disabled:opacity-50"
      >
        Resolve
      </button>
    );
  }

  return null;
}
