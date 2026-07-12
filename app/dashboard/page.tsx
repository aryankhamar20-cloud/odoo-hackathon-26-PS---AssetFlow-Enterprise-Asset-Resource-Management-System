import { createClient } from "@/lib/supabase/server";
import { KpiCard } from "@/components/KpiCard";
import { getCurrentEmployee } from "@/lib/auth";

export default async function DashboardPage() {
  const supabase = createClient();
  const currentEmployee = await getCurrentEmployee(supabase);
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

  const role = currentEmployee?.role;
  const quickActions = [
    { href: "/assets/new", label: "Register Asset", show: role === "asset_manager" || role === "admin" },
    { href: "/org-setup/employees", label: "Promote Employee", show: role === "admin" },
    { href: "/bookings", label: "Book a Resource", show: true },
    { href: "/maintenance", label: "Raise Maintenance Request", show: true },
    {
      href: "/allocations",
      label: "Review Pending Transfers",
      show: role === "asset_manager" || role === "department_head" || role === "admin",
    },
  ].filter((a) => a.show);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-4">Dashboard</h1>

      {quickActions.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {quickActions.map((a) => (
            <a
              key={a.href}
              href={a.href}
              className="rounded border border-teal px-3 py-2 text-sm text-teal hover:bg-teal-soft"
            >
              {a.label}
            </a>
          ))}
        </div>
      )}

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
