"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function TransferApproveButton({ transferRequestId }: { transferRequestId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    setLoading(true);
    await fetch("/api/transfer/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transferRequestId }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleApprove}
      disabled={loading}
      className="rounded bg-teal px-3 py-1 text-xs text-white disabled:opacity-50"
    >
      {loading ? "Approving..." : "Approve"}
    </button>
  );
}
