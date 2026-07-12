// Activity Log — ported from a teammate's stray Vite/React push
// (AppContext.jsx's logAction helper). Every mutation across the app now
// calls lib/business-logic.ts's logActivity() right after it succeeds; this
// page just reads that table back out, most recent first.
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export default async function ActivityLogPage() {
  const supabase = createClient();
  await requireRole(supabase, ["asset_manager", "admin"]);

  const { data: logs } = await supabase
    .from("activity_logs")
    .select("id, action, details, actor_name, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const fmt = (iso: string) => new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Activity Log</h1>
      <p className="text-sm text-ink-soft">
        Most recent 200 actions across the app — allocations, transfers, bookings, maintenance, org setup, and audits.
        Requires <code>supabase/migration_02_audit_reports_log.sql</code> to have been run.
      </p>

      <table className="w-full border-collapse overflow-hidden rounded-lg border border-border bg-paper-raised">
        <thead>
          <tr className="bg-paper text-left text-sm text-ink-soft">
            <th className="p-3">Action</th>
            <th className="p-3">Details</th>
            <th className="p-3">By</th>
            <th className="p-3">When</th>
          </tr>
        </thead>
        <tbody>
          {logs?.map((l: any) => (
            <tr key={l.id} className="border-t border-border text-sm">
              <td className="p-3 font-medium">{l.action}</td>
              <td className="p-3 text-ink-soft">{l.details}</td>
              <td className="p-3">{l.actor_name}</td>
              <td className="p-3 text-xs text-ink-soft">{fmt(l.created_at)}</td>
            </tr>
          ))}
          {(!logs || logs.length === 0) && (
            <tr>
              <td className="p-3 text-ink-soft" colSpan={4}>
                No activity logged yet — this fills in as people use the app.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
