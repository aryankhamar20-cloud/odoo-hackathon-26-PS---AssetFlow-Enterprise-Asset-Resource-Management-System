// Audit Cycles — ported from a teammate's stray Vite/React push
// (AppContext.jsx's createAuditCycle/checkAuditAsset/closeAuditCycle) into
// the real app. Uses audit_cycles/audit_items from schema.sql, extended by
// supabase/migration_02_audit_reports_log.sql (name, scope_location,
// lead_auditor_employee_id, checked_at columns).
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { createAuditCycle, logActivity } from "@/lib/business-logic";
import { revalidatePath } from "next/cache";
import { AssetTagChip } from "@/components/AssetTagChip";
import { AuditItemCheck } from "@/components/AuditItemCheck";
import { CloseAuditButton } from "@/components/CloseAuditButton";

async function startAudit(formData: FormData) {
  "use server";
  const supabase = createClient();
  const acting = await requireRole(supabase, ["asset_manager", "admin"]);

  const name = (formData.get("name") as string)?.trim();
  const departmentId = (formData.get("department_id") as string) || undefined;
  const location = (formData.get("location") as string)?.trim() || undefined;
  const dateRangeStart = (formData.get("date_range_start") as string) || null;
  const dateRangeEnd = (formData.get("date_range_end") as string) || null;
  const leadAuditorEmployeeId = (formData.get("lead_auditor_employee_id") as string) || null;

  if (!name || (!departmentId && !location)) return;

  await createAuditCycle(
    supabase,
    name,
    { departmentId, location },
    dateRangeStart,
    dateRangeEnd,
    leadAuditorEmployeeId
  );
  await logActivity(supabase, "Create Audit Cycle", `Started audit cycle "${name}".`, acting.id, acting.name);
  revalidatePath("/audits");
}

export default async function AuditsPage() {
  const supabase = createClient();
  await requireRole(supabase, ["asset_manager", "admin"]);

  const [{ data: cycles }, { data: departments }, { data: employees }] = await Promise.all([
    supabase
      .from("audit_cycles")
      .select(
        "id, name, status, scope_department_id, scope_location, date_range_start, date_range_end, lead_auditor_employee_id, created_at"
      )
      .order("created_at", { ascending: false }),
    supabase.from("departments").select("id, name").order("name"),
    supabase.from("employees").select("id, name").order("name"),
  ]);

  const cycleIds = (cycles ?? []).map((c: any) => c.id);
  const { data: items } =
    cycleIds.length > 0
      ? await supabase
          .from("audit_items")
          .select("id, audit_cycle_id, asset_id, verification_status, assets:asset_id(name, asset_tag, location)")
          .in("audit_cycle_id", cycleIds)
      : { data: [] as any[] };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Audit Cycles</h1>
      <p className="text-sm text-ink-soft">
        Scope an audit by department or location, check off each asset as Verified / Missing / Damaged, then close the
        cycle — any asset still marked Missing is automatically set to Lost.
      </p>

      <form action={startAudit} className="space-y-3 rounded-lg border border-border bg-paper-raised p-4">
        <h3 className="font-display font-bold">Start a new audit</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            name="name"
            placeholder="Audit name, e.g. Q3 IT Lab Audit"
            required
            className="rounded border border-border px-3 py-2"
          />
          <select name="lead_auditor_employee_id" className="rounded border border-border px-3 py-2">
            <option value="">Lead auditor (optional)</option>
            {employees?.map((e: any) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
          <select name="department_id" className="rounded border border-border px-3 py-2">
            <option value="">Scope by department (choose one)</option>
            {departments?.map((d: any) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <input
            name="location"
            placeholder="...or scope by location (leave department blank)"
            className="rounded border border-border px-3 py-2"
          />
          <input type="date" name="date_range_start" className="rounded border border-border px-3 py-2" />
          <input type="date" name="date_range_end" className="rounded border border-border px-3 py-2" />
        </div>
        <button type="submit" className="rounded bg-teal px-4 py-2 text-white">Start Audit</button>
      </form>

      <div className="space-y-4">
        {cycles?.map((c: any) => {
          const dept = departments?.find((d: any) => d.id === c.scope_department_id);
          const auditor = employees?.find((e: any) => e.id === c.lead_auditor_employee_id);
          const cycleItems = (items ?? []).filter((i: any) => i.audit_cycle_id === c.id);
          const missingCount = cycleItems.filter((i: any) => i.verification_status === "Missing").length;
          return (
            <div key={c.id} className="rounded-lg border border-border bg-paper-raised p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-display font-bold">{c.name}</h3>
                  <p className="text-xs text-ink-soft">
                    Scope: {dept ? dept.name : c.scope_location ?? "—"} · {c.date_range_start ?? "?"} →{" "}
                    {c.date_range_end ?? "?"}
                    {auditor ? ` · Auditor: ${auditor.name}` : ""}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium text-white ${
                    c.status === "Closed" ? "bg-status-retired" : "bg-teal"
                  }`}
                >
                  {c.status}
                </span>
              </div>

              {missingCount > 0 && (
                <p className="mt-2 text-xs text-status-lost">
                  {missingCount} asset(s) currently marked Missing — closing this cycle will set them to Lost.
                </p>
              )}

              <table className="mt-3 w-full border-collapse overflow-hidden rounded-lg border border-border">
                <thead>
                  <tr className="bg-paper text-left text-xs text-ink-soft">
                    <th className="p-2">Asset</th>
                    <th className="p-2">Location</th>
                    <th className="p-2">Check</th>
                  </tr>
                </thead>
                <tbody>
                  {cycleItems.map((i: any) => (
                    <tr key={i.id} className="border-t border-border text-sm">
                      <td className="p-2">
                        {i.assets?.name} <AssetTagChip tag={i.assets?.asset_tag} />
                      </td>
                      <td className="p-2">{i.assets?.location ?? "—"}</td>
                      <td className="p-2">
                        <AuditItemCheck itemId={i.id} currentStatus={i.verification_status} disabled={c.status === "Closed"} />
                      </td>
                    </tr>
                  ))}
                  {cycleItems.length === 0 && (
                    <tr>
                      <td className="p-2 text-ink-soft" colSpan={3}>No assets fell within this scope.</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {c.status === "Open" && (
                <div className="mt-3">
                  <CloseAuditButton auditCycleId={c.id} />
                </div>
              )}
            </div>
          );
        })}
        {(!cycles || cycles.length === 0) && <p className="text-ink-soft">No audit cycles yet.</p>}
      </div>
    </div>
  );
}
