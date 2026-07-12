import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "@/lib/auth";
import { RaiseMaintenanceForm } from "@/components/RaiseMaintenanceForm";
import { ApprovalStepper } from "@/components/ApprovalStepper";
import { MaintenanceActions } from "@/components/MaintenanceActions";
import { AssetTagChip } from "@/components/AssetTagChip";

export default async function MaintenancePage() {
  const supabase = createClient();

  const [{ data: assets }, { data: requests }, currentEmployee] = await Promise.all([
    supabase.from("assets").select("id, name, asset_tag").order("name"),
    supabase
      .from("maintenance_requests")
      .select("id, issue_description, priority, status, created_at, assets:asset_id(name, asset_tag)")
      .order("created_at", { ascending: false }),
    getCurrentEmployee(supabase),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Maintenance</h1>

      <RaiseMaintenanceForm assets={assets ?? []} employeeId={currentEmployee?.id ?? null} />

      <table className="w-full border-collapse overflow-hidden rounded-lg border border-border bg-paper-raised">
        <thead>
          <tr className="bg-paper text-left text-sm text-ink-soft">
            <th className="p-3">Asset</th>
            <th className="p-3">Issue</th>
            <th className="p-3">Priority</th>
            <th className="p-3">Progress</th>
            <th className="p-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {requests?.map((r: any) => (
            <tr key={r.id} className="border-t border-border">
              <td className="p-3">{r.assets?.name} <AssetTagChip tag={r.assets?.asset_tag} /></td>
              <td className="p-3">{r.issue_description}</td>
              <td className="p-3">{r.priority}</td>
              <td className="p-3"><ApprovalStepper status={r.status} /></td>
              <td className="p-3">
                <MaintenanceActions
                  requestId={r.id}
                  status={r.status}
                  approverEmployeeId={currentEmployee?.id ?? null}
                />
              </td>
            </tr>
          ))}
          {(!requests || requests.length === 0) && (
            <tr><td className="p-3 text-ink-soft" colSpan={5}>No maintenance requests yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
