import { createClient } from "@/lib/supabase/server";
import { KpiCard } from "@/components/KpiCard";

export default async function DashboardPage() {
  const supabase = createClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [
    { count: available },
    { count: allocated },
    { count: activeBookings },
    { data: overdue },
    { count: maintenanceToday },
    { count: pendingTransfers },
    { data: upcomingReturns },
  ] = await Promise.all([
    supabase.from("assets").select("id", { count: "exact", head: true }).eq("status", "Available"),
    supabase.from("assets").select("id", { count: "exact", head: true }).eq("status", "Allocated"),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "Upcoming"),
    supabase.from("overdue_allocations").select("*"),
    supabase
      .from("maintenance_requests")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString())
      .lte("created_at", todayEnd.toISOString()),
    supabase.from("transfer_requests").select("id", { count: "exact", head: true }).eq("status", "Requested"),
    supabase
      .from("allocations")
      .select("id, expected_return_date")
      .is("returned_at", null)
      .gte("expected_return_date", new Date().toISOString().slice(0, 10))
      .lte("expected_return_date", new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-4">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <KpiCard label="Assets Available" value={available ?? 0} />
        <KpiCard label="Assets Allocated" value={allocated ?? 0} />
        <KpiCard label="Active Bookings" value={activeBookings ?? 0} />
        <KpiCard label="Maintenance Today" value={maintenanceToday ?? 0} />
        <KpiCard label="Pending Transfers" value={pendingTransfers ?? 0} />
        <KpiCard label="Upcoming Returns (7d)" value={upcomingReturns?.length ?? 0} />
      </div>

      {overdue && overdue.length > 0 && (
        <div className="mt-6 rounded-lg border-2 border-status-lost bg-red-50 p-4">
          <h2 className="font-bold text-status-lost">Overdue returns</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {overdue.map((o: any) => (
              <li key={o.id}>
                {o.employee_name} — expected {o.expected_return_date}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
