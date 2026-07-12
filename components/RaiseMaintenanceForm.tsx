"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function RaiseMaintenanceForm({
  assets,
  employeeId,
}: {
  assets: { id: string; name: string; asset_tag: string }[];
  employeeId: string | null;
}) {
  const router = useRouter();
  const [assetId, setAssetId] = useState("");
  const [issue, setIssue] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [photoUrl, setPhotoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!assetId || !issue || !employeeId) return;
    setSubmitting(true);
    await fetch("/api/maintenance/raise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetId, issueDescription: issue, priority, photoUrl, employeeId }),
    });
    setSubmitting(false);
    setIssue("");
    setPhotoUrl("");
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-border bg-paper-raised p-4">
      <h3 className="font-display font-bold mb-2">Raise a maintenance request</h3>
      <div className="grid gap-2 md:grid-cols-2">
        <select value={assetId} onChange={(e) => setAssetId(e.target.value)} className="rounded border border-border px-3 py-2">
          <option value="">Choose asset</option>
          {assets.map((a) => (
            <option key={a.id} value={a.id}>{a.name} ({a.asset_tag})</option>
          ))}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="rounded border border-border px-3 py-2">
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
      </div>
      <textarea
        value={issue}
        onChange={(e) => setIssue(e.target.value)}
        placeholder="Describe the issue"
        className="mt-2 w-full rounded border border-border px-3 py-2"
        rows={2}
      />
      <input
        value={photoUrl}
        onChange={(e) => setPhotoUrl(e.target.value)}
        placeholder="Photo URL (optional — fallback until Storage is wired)"
        className="mt-2 w-full rounded border border-border px-3 py-2"
      />
      <button
        onClick={handleSubmit}
        disabled={!assetId || !issue || submitting || !employeeId}
        className="mt-2 rounded bg-teal px-4 py-2 text-white disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Raise Request"}
      </button>
      {!employeeId && <p className="mt-2 text-sm text-status-lost">Log in to raise a request.</p>}
    </div>
  );
}
