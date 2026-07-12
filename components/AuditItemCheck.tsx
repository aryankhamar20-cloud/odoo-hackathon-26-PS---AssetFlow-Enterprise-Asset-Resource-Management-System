"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AuditItemCheck({
  itemId,
  currentStatus,
  disabled,
}: {
  itemId: string;
  currentStatus: string | null;
  disabled: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!status) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/audits/check-item", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auditItemId: itemId, verificationStatus: status }),
    });
    setLoading(false);
    if (!res.ok) {
      const result = await res.json().catch(() => ({}));
      setError(result.error ?? "That action wasn't allowed.");
      return;
    }
    router.refresh();
  }

  if (disabled) {
    return <span className="text-xs text-ink-soft">{currentStatus ?? "Unchecked"}</span>;
  }

  return (
    <div className="flex items-center gap-1">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="rounded border border-border px-2 py-1 text-xs"
      >
        <option value="">Unchecked</option>
        <option value="Verified">Verified</option>
        <option value="Missing">Missing</option>
        <option value="Damaged">Damaged</option>
      </select>
      <button
        onClick={handleSave}
        disabled={loading || !status}
        className="rounded bg-teal px-2 py-1 text-xs text-white disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save"}
      </button>
      {error && <span className="text-xs text-status-lost">{error}</span>}
    </div>
  );
}
