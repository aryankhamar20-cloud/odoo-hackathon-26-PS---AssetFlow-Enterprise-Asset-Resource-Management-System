"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReturnAssetButton({ allocationId, assetId }: { allocationId: string; assetId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleReturn() {
    const note = window.prompt("Condition check-in note (optional):") ?? "";
    setLoading(true);
    await fetch("/api/return", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ allocationId, assetId, conditionNote: note }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleReturn}
      disabled={loading}
      className="rounded border border-border px-3 py-1 text-xs"
    >
      {loading ? "Returning..." : "Mark Returned"}
    </button>
  );
}
