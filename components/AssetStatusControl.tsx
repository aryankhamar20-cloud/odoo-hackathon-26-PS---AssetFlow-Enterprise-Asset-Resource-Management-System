"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const OPTIONS: { value: "Lost" | "Retired" | "Disposed"; label: string }[] = [
  { value: "Lost", label: "Mark as Lost" },
  { value: "Retired", label: "Retire" },
  { value: "Disposed", label: "Dispose" },
];

export function AssetStatusControl({ assetId }: { assetId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSetStatus(status: string) {
    if (!window.confirm(`This can't be easily undone. Mark this asset as "${status}"?`)) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/assets/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetId, status }),
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
    <div className="rounded-lg border border-border bg-paper-raised p-4">
      <h3 className="font-display font-bold mb-2 text-sm text-ink-soft">Asset lifecycle</h3>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            disabled={loading}
            onClick={() => handleSetStatus(o.value)}
            className="rounded border border-status-lost px-3 py-1 text-xs text-status-lost hover:bg-red-50 disabled:opacity-50"
          >
            {o.label}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-status-lost">{error}</p>}
    </div>
  );
}
