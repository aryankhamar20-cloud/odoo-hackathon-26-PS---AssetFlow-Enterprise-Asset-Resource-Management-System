"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function TransferRejectButton({ transferRequestId }: { transferRequestId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleReject() {
    setLoading(true);
    await fetch("/api/transfer/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transferRequestId }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleReject}
      disabled={loading}
      className="rounded border border-border px-3 py-1 text-xs disabled:opacity-50"
    >
      {loading ? "Rejecting..." : "Reject"}
    </button>
  );
}
