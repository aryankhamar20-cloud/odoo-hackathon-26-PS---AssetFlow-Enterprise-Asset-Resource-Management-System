"use client";
// CORE — this is the piece that has to work live: Allocate -> conflict
// blocked -> ConflictModal -> Request Transfer. Keep this wiring intact.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConflictModal } from "./ConflictModal";

export function AllocateAssetForm({
  assetId,
  employees,
  departments,
}: {
  assetId: string;
  employees: { id: string; name: string }[];
  departments: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [targetType, setTargetType] = useState<"employee" | "department">("employee");
  const [employeeId, setEmployeeId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("");
  const [conflict, setConflict] = useState<{ holderName: string } | null>(null);
  const [transferSent, setTransferSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedId = targetType === "employee" ? employeeId : departmentId;

  async function handleAllocate() {
    if (!selectedId) return;
    setSubmitting(true);
    setTransferSent(false);
    setError(null);
    const res = await fetch("/api/allocate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assetId,
        employeeId: targetType === "employee" ? employeeId : undefined,
        departmentId: targetType === "department" ? departmentId : undefined,
        expectedReturn: expectedReturn || undefined,
      }),
    });
    const result = await res.json();
    setSubmitting(false);

    if (res.ok && !result.blocked) {
      router.refresh();
      return;
    }

    if (res.status === 401) {
      setError("Your session expired — log in again to allocate.");
      return;
    }

    // Blocked by the conflict rule — pull the holder name out of the
    // message ("Currently held by X") so the modal can show it directly.
    const holderName = (result.message as string)?.replace("Currently held by ", "") || "another employee";
    setConflict({ holderName });
  }

  async function handleRequestTransfer() {
    if (targetType !== "employee" || !employeeId) {
      // Transfers are employee-to-employee only; a blocked department
      // allocation just shows the conflict without a transfer option.
      setConflict(null);
      return;
    }
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
      <div className="mb-2 flex gap-4 text-sm">
        <label className="flex items-center gap-1">
          <input
            type="radio"
            checked={targetType === "employee"}
            onChange={() => setTargetType("employee")}
          />
          To Employee
        </label>
        <label className="flex items-center gap-1">
          <input
            type="radio"
            checked={targetType === "department"}
            onChange={() => setTargetType("department")}
          />
          To Department
        </label>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        {targetType === "employee" ? (
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
        ) : (
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="rounded border border-border px-3 py-2"
          >
            <option value="">Choose department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        )}
        <input
          type="date"
          value={expectedReturn}
          onChange={(e) => setExpectedReturn(e.target.value)}
          className="rounded border border-border px-3 py-2"
          title="Expected return date (optional)"
        />
        <button
          onClick={handleAllocate}
          disabled={!selectedId || submitting}
          className="rounded bg-teal px-4 py-2 text-white disabled:opacity-50"
        >
          {submitting ? "Allocating..." : "Allocate Asset"}
        </button>
      </div>

      {transferSent && (
        <p className="mt-2 text-sm text-status-available">Transfer request sent.</p>
      )}
      {error && <p className="mt-2 text-sm text-status-lost">{error}</p>}

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
