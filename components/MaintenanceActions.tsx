"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function MaintenanceActions({
  requestId,
  status,
  approverEmployeeId,
}: {
  requestId: string;
  status: string;
  approverEmployeeId: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function post(url: string, body: Record<string, unknown>) {
    setLoading(true);
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    router.refresh();
  }

  if (!approverEmployeeId && status === "Pending") {
    return <span className="text-xs text-ink-soft">Log in to act on this request.</span>;
  }

  if (status === "Pending") {
    return (
      <div className="flex gap-2">
        <button
          disabled={loading}
          onClick={() => post("/api/maintenance/approve", { requestId, approverEmployeeId })}
          className="rounded bg-teal px-3 py-1 text-xs text-white disabled:opacity-50"
        >
          Approve
        </button>
        <button
          disabled={loading}
          onClick={() => post("/api/maintenance/reject", { requestId, approverEmployeeId })}
          className="rounded border border-border px-3 py-1 text-xs disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    );
  }

  if (status === "Approved") {
    return (
      <button
        disabled={loading}
        onClick={() => {
          const name = window.prompt("Technician name:");
          if (name) post("/api/maintenance/assign-technician", { requestId, technicianName: name });
        }}
        className="rounded bg-teal px-3 py-1 text-xs text-white disabled:opacity-50"
      >
        Assign Technician
      </button>
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
