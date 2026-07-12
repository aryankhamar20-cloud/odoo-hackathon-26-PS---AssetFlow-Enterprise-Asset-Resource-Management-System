"use client";
// CORE — this is the piece that has to work live: Allocate -> conflict
// blocked -> ConflictModal -> Request Transfer. Keep this wiring intact.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConflictModal } from "./ConflictModal";

export function AllocateAssetForm({
  assetId,
  employees,
}: {
  assetId: string;
  employees: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("");
  const [conflict, setConflict] = useState<{ holderName: string } | null>(null);
  const [transferSent, setTransferSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleAllocate() {
    if (!employeeId) return;
    setSubmitting(true);
    setTransferSent(false);
    const res = await fetch("/api/allocate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetId, employeeId, expectedReturn: expectedReturn || undefined }),
    });
    const result = await res.json();
    setSubmitting(false);

    if (res.ok && !result.blocked) {
      router.refresh();
      return;
    }

    // Blocked — pull the holder name out of the message the API returned
    // ("Currently held by X") so the modal can show it directly.
    const holderName = (result.message as string)?.replace("Currently held by ", "") || "another employee";
    setConflict({ holderName });
  }

  async function handleRequestTransfer() {
    if (!employeeId) return;
    await fetch("/api/transfer/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetId, toEmployeeId: employeeId }),
    });
    setConflict(null);
    setTransferSent(true);
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-border bg-paper-raised p-4">
      <h3 className="font-display font-bold mb-2">Allocate this asset</h3>
      <div className="flex flex-wrap items-end gap-2">
        <select
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          className="rounded border border-border px-3 py-2"
        >
          <option value="">Choose employee</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
        <input
          type="date"
          value={expectedReturn}
          onChange={(e) => setExpectedReturn(e.target.value)}
          className="rounded border border-border px-3 py-2"
          title="Expected return date (optional)"
        />
        <button
          onClick={handleAllocate}
          disabled={!employeeId || submitting}
          className="rounded bg-teal px-4 py-2 text-white disabled:opacity-50"
        >
          {submitting ? "Allocating..." : "Allocate Asset"}
        </button>
      </div>

      {transferSent && (
        <p className="mt-2 text-sm text-status-available">Transfer request sent.</p>
      )}

      {conflict && (
        <ConflictModal
          holderName={conflict.holderName}
          onClose={() => setConflict(null)}
          onRequestTransfer={handleRequestTransfer}
        />
      )}
    </div>
  );
}
