"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    setLoading(true);
    await fetch("/api/book/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button onClick={handleCancel} disabled={loading} className="rounded border border-border px-3 py-1 text-xs">
      {loading ? "Cancelling..." : "Cancel"}
    </button>
  );
}
