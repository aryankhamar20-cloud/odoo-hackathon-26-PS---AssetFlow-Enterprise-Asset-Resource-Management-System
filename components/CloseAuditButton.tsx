"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function CloseAuditButton({ auditCycleId }: { auditCycleId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClose() {
    if (!window.confirm("Close this audit? Any asset still marked Missing will be set to Lost.")) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/audits/close", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auditCycleId }),
    });
    setLoading(false);
    if (!res.ok) {
      const result = await res.json().catch(() => ({}));
      setError(result.error ?? "That action wasn't allowed.");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <button
        onClick={handleClose}
        disabled={loading}
        className="rounded bg-status-lost px-3 py-1 text-xs text-white disabled:opacity-50"
      >
        {loading ? "Closing..." : "Close Audit Cycle"}
      </button>
      {error && <p className="mt-1 text-xs text-status-lost">{error}</p>}
    </div>
  );
}
