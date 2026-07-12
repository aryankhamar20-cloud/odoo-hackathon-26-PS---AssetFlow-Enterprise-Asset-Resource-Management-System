import { createClient } from "@/lib/supabase/server";
import { StatusChip } from "@/components/StatusChip";
import { AssetTagChip } from "@/components/AssetTagChip";
import { TransferApproveButton } from "@/components/TransferApproveButton";
import { TransferRejectButton } from "@/components/TransferRejectButton";
import { ReturnAssetButton } from "@/components/ReturnAssetButton";

export default async function AllocationsPage() {
  const supabase = createClient();

  const [{ data: transfers }, { data: activeAllocations }] = await Promise.all([
    supabase
      .from("transfer_requests")
      .select("id, status, created_at, assets:asset_id(name, asset_tag), from_employee:from_employee_id(name), to_employee:to_employee_id(name)")
      .eq("status", "Requested")
      .order("created_at", { ascending: false }),
    supabase
      .from("allocations")
      .select("id, asset_id, expected_return_date, created_at, assets:asset_id(name, asset_tag, status), employees:employee_id(name), departments:department_id(name)")
      .is("returned_at", null)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl font-bold">Allocations & Transfers</h1>

      <div>
        <h2 className="font-display text-lg font-bold mb-2">Pending transfer requests</h2>
        <p className="mb-2 text-xs text-ink-soft">Approve/reject is limited to Asset Manager / Department Head server-side, regardless of what this UI shows.</p>
        <table className="w-full border-collapse overflow-hidden rounded-lg border border-border bg-paper-raised">
          <thead>
            <tr className="bg-paper text-left text-sm text-ink-soft">
              <th className="p-3">Asset</th>
              <th className="p-3">From</th>
              <th className="p-3">To</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {transfers?.map((t: any) => (
              <tr key={t.id} className="border-t border-border">
                <td className="p-3">{t.assets?.name} <AssetTagChip tag={t.assets?.asset_tag} /></td>
                <td className="p-3">{t.from_employee?.name ?? "—"}</td>
                <td className="p-3">{t.to_employee?.name}</td>
                <td className="p-3 flex gap-2">
                  <TransferApproveButton transferRequestId={t.id} />
                  <TransferRejectButton transferRequestId={t.id} />
                </td>
              </tr>
            ))}
            {(!transfers || transfers.length === 0) && (
              <tr><td className="p-3 text-ink-soft" colSpan={4}>No pending transfer requests.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="font-display text-lg font-bold mb-2">Active allocations</h2>
        <table className="w-full border-collapse overflow-hidden rounded-lg border border-border bg-paper-raised">
          <thead>
            <tr className="bg-paper text-left text-sm text-ink-soft">
              <th className="p-3">Asset</th>
              <th className="p-3">Held by</th>
              <th className="p-3">Expected return</th>
              <th className="p-3">Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {activeAllocations?.map((a: any) => (
              <tr key={a.id} className="border-t border-border">
                <td className="p-3">{a.assets?.name} <AssetTagChip tag={a.assets?.asset_tag} /></td>
                <td className="p-3">{a.employees?.name ?? (a.departments?.name ? `${a.departments.name} (dept.)` : "—")}</td>
                <td className="p-3">{a.expected_return_date ?? "—"}</td>
                <td className="p-3">{a.assets?.status && <StatusChip status={a.assets.status} />}</td>
                <td className="p-3"><ReturnAssetButton allocationId={a.id} assetId={a.asset_id} /></td>
              </tr>
            ))}
            {(!activeAllocations || activeAllocations.length === 0) && (
              <tr><td className="p-3 text-ink-soft" colSpan={5}>No active allocations.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
