import { createClient } from "@/lib/supabase/server";
import { StatusChip } from "@/components/StatusChip";
import { AssetTagChip } from "@/components/AssetTagChip";
import { AllocateAssetForm } from "@/components/AllocateAssetForm";

export default async function AssetDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const [{ data: asset }, { data: employees }, { data: allocations }, { data: maintenance }] =
    await Promise.all([
      supabase.from("assets").select("*").eq("id", params.id).single(),
      supabase.from("employees").select("id, name").order("name"),
      supabase
        .from("allocations")
        .select("id, employee_id, department_id, expected_return_date, returned_at, condition_checkin_note, created_at, employees:employee_id(name)")
        .eq("asset_id", params.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("maintenance_requests")
        .select("id, issue_description, priority, status, created_at, resolved_at")
        .eq("asset_id", params.id)
        .order("created_at", { ascending: false }),
    ]);

  if (!asset) {
    return <p className="text-status-lost">Asset not found.</p>;
  }

  const holder = employees?.find((e: any) => e.id === asset.current_holder_employee_id);
  const canAllocate = !["Under Maintenance", "Retired", "Disposed"].includes(asset.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <AssetTagChip tag={asset.asset_tag} />
            <StatusChip status={asset.status} />
          </div>
          <h1 className="font-display text-2xl font-bold">{asset.name}</h1>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-paper-raised p-4 text-sm md:grid-cols-4">
        <div><div className="text-ink-soft">Serial</div><div>{asset.serial_number ?? "—"}</div></div>
        <div><div className="text-ink-soft">Condition</div><div>{asset.condition ?? "—"}</div></div>
        <div><div className="text-ink-soft">Location</div><div>{asset.location ?? "—"}</div></div>
        <div><div className="text-ink-soft">Current holder</div><div>{holder?.name ?? "—"}</div></div>
      </div>

      {canAllocate ? (
        <AllocateAssetForm assetId={asset.id} employees={employees ?? []} />
      ) : (
        <p className="text-sm text-ink-soft">This asset can't be allocated in its current status ({asset.status}).</p>
      )}

      <div>
        <h2 className="font-display text-lg font-bold mb-2">Allocation history</h2>
        <table className="w-full border-collapse overflow-hidden rounded-lg border border-border bg-paper-raised">
          <thead>
            <tr className="bg-paper text-left text-sm text-ink-soft">
              <th className="p-3">Employee</th>
              <th className="p-3">Expected return</th>
              <th className="p-3">Returned</th>
            </tr>
          </thead>
          <tbody>
            {allocations?.map((a: any) => (
              <tr key={a.id} className="border-t border-border">
                <td className="p-3">{a.employees?.name ?? "—"}</td>
                <td className="p-3">{a.expected_return_date ?? "—"}</td>
                <td className="p-3">{a.returned_at ? new Date(a.returned_at).toLocaleDateString() : "Not returned"}</td>
              </tr>
            ))}
            {(!allocations || allocations.length === 0) && (
              <tr><td className="p-3 text-ink-soft" colSpan={3}>No allocation history yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="font-display text-lg font-bold mb-2">Maintenance history</h2>
        <table className="w-full border-collapse overflow-hidden rounded-lg border border-border bg-paper-raised">
          <thead>
            <tr className="bg-paper text-left text-sm text-ink-soft">
              <th className="p-3">Issue</th>
              <th className="p-3">Priority</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {maintenance?.map((m: any) => (
              <tr key={m.id} className="border-t border-border">
                <td className="p-3">{m.issue_description}</td>
                <td className="p-3">{m.priority ?? "—"}</td>
                <td className="p-3">{m.status}</td>
              </tr>
            ))}
            {(!maintenance || maintenance.length === 0) && (
              <tr><td className="p-3 text-ink-soft" colSpan={3}>No maintenance history yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
