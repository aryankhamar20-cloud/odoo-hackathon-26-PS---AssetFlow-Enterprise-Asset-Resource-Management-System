// Reports & Analytics — ported from a teammate's stray Vite/React push
// (src/components/Reports.jsx) that was never wired into the real app.
// Same chart logic, rebuilt as a Server Component against live Supabase
// data instead of mock/localStorage data.
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { AssetTagChip } from "@/components/AssetTagChip";

const STATUS_COLORS: Record<string, string> = {
  Available: "#2E8B57",
  Allocated: "#3163C4",
  "Under Maintenance": "#D4712B",
  Other: "#C4443A",
};

function lifespanMonthsFor(categoryName: string | undefined) {
  const name = (categoryName ?? "").toLowerCase();
  if (name.includes("electronic")) return 24;
  if (name.includes("furniture")) return 36;
  if (name.includes("vehicle")) return 48;
  return 120;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const supabase = createClient();
  await requireRole(supabase, ["asset_manager", "admin"]);

  const heatmapDate = searchParams.date || new Date().toISOString().slice(0, 10);

  const [
    { data: assets },
    { data: categories },
    { data: departments },
    { data: employees },
    { data: activeAllocations },
    { data: maintenanceRequests },
    { data: bookings },
  ] = await Promise.all([
    supabase
      .from("assets")
      .select("id, name, asset_tag, status, category_id, location, condition, acquisition_date, is_bookable"),
    supabase.from("categories").select("id, name"),
    supabase.from("departments").select("id, name").eq("status", "active"),
    supabase.from("employees").select("id, department_id"),
    supabase.from("allocations").select("asset_id, employee_id, department_id").is("returned_at", null),
    supabase.from("maintenance_requests").select("asset_id"),
    supabase
      .from("bookings")
      .select("resource_asset_id, start_time, end_time, status")
      .gte("start_time", `${heatmapDate}T00:00:00`)
      .lte("start_time", `${heatmapDate}T23:59:59`)
      .neq("status", "Cancelled"),
  ]);

  const assetList = assets ?? [];
  const total = assetList.length || 1;
  const availCount = assetList.filter((a: any) => a.status === "Available").length;
  const allocCount = assetList.filter((a: any) => a.status === "Allocated").length;
  const maintCount = assetList.filter((a: any) => a.status === "Under Maintenance").length;
  const otherCount = assetList.filter((a: any) =>
    ["Lost", "Retired", "Disposed", "Reserved"].includes(a.status)
  ).length;

  const r = 50;
  const circ = 2 * Math.PI * r;
  const segments: [string, number, string][] = [
    ["Allocated", allocCount, STATUS_COLORS.Allocated],
    ["Available", availCount, STATUS_COLORS.Available],
    ["Under Maintenance", maintCount, STATUS_COLORS["Under Maintenance"]],
    ["Other", otherCount, STATUS_COLORS.Other],
  ];
  let runningOffset = 0;
  const arcs = segments.map(([label, count, color]) => {
    const len = (count / total) * circ;
    const arc = { label, count, color, len, offset: runningOffset };
    runningOffset += len;
    return arc;
  });

  const deptStats = (departments ?? []).map((d: any) => {
    const deptEmployeeIds = new Set(
      (employees ?? []).filter((e: any) => e.department_id === d.id).map((e: any) => e.id)
    );
    const count = (activeAllocations ?? []).filter(
      (al: any) => al.department_id === d.id || (al.employee_id && deptEmployeeIds.has(al.employee_id))
    ).length;
    return { name: d.name, count };
  });
  const maxDept = Math.max(...deptStats.map((d: any) => d.count), 1);

  const catFreq = (categories ?? []).map((c: any) => {
    const catAssetIds = new Set(assetList.filter((a: any) => a.category_id === c.id).map((a: any) => a.id));
    const count = (maintenanceRequests ?? []).filter((m: any) => catAssetIds.has(m.asset_id)).length;
    return { name: c.name, count };
  });
  const maxCat = Math.max(...catFreq.map((c: any) => c.count), 1);

  const bookableAssets = assetList.filter((a: any) => a.is_bookable);
  const hours = Array.from({ length: 11 }, (_, i) => 8 + i);
  const densityLevel = (assetId: string, hour: number) => {
    const hits = (bookings ?? []).filter((b: any) => {
      if (b.resource_asset_id !== assetId) return false;
      const s = new Date(b.start_time).getHours();
      const e = new Date(b.end_time).getHours();
      return hour >= s && hour < e;
    }).length;
    if (hits === 0) return "";
    if (hits === 1) return "bg-status-available/30";
    if (hits === 2) return "bg-status-available/60";
    return "bg-status-available";
  };

  const dueForMaintenance = assetList.filter(
    (a: any) =>
      ["Fair", "Poor"].includes(a.condition ?? "") &&
      !["Under Maintenance", "Lost", "Retired", "Disposed"].includes(a.status)
  );

  const now = new Date();
  const nearingRetirement = assetList.filter((a: any) => {
    if (!a.acquisition_date || ["Lost", "Retired", "Disposed"].includes(a.status)) return false;
    const categoryName = categories?.find((c: any) => c.id === a.category_id)?.name;
    const acq = new Date(a.acquisition_date);
    const ageMonths = (now.getFullYear() - acq.getFullYear()) * 12 + (now.getMonth() - acq.getMonth());
    return ageMonths >= lifespanMonthsFor(categoryName) - 6;
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Reports &amp; Analytics</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-paper-raised p-4">
          <h3 className="font-display font-bold mb-3">Asset utilization breakdown</h3>
          <div className="flex items-center gap-6">
            <svg width="150" height="150" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r={r} fill="transparent" stroke="#EDEFF3" strokeWidth="18" />
              {arcs.map(
                (arc) =>
                  arc.len > 0 && (
                    <circle
                      key={arc.label}
                      cx="70"
                      cy="70"
                      r={r}
                      fill="transparent"
                      stroke={arc.color}
                      strokeWidth="18"
                      strokeDasharray={`${arc.len} ${circ}`}
                      strokeDashoffset={-arc.offset}
                      transform="rotate(-90 70 70)"
                    />
                  )
              )}
              <text x="70" y="66" textAnchor="middle" fontSize="20" fontWeight="700" fill="#101828">
                {assetList.length}
              </text>
              <text x="70" y="82" textAnchor="middle" fontSize="8" fill="#3A4356">
                TOTAL ASSETS
              </text>
            </svg>
            <div className="space-y-1 text-sm">
              {arcs.map((arc) => (
                <div key={arc.label} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: arc.color }} />
                  <span>
                    {arc.label}: <b>{Math.round((arc.count / total) * 100)}%</b> ({arc.count})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-paper-raised p-4">
          <h3 className="font-display font-bold mb-3">Department allocation summary</h3>
          <div className="space-y-3">
            {deptStats.map((d: any) => (
              <div key={d.name}>
                <div className="flex justify-between text-sm">
                  <span>{d.name}</span>
                  <b>{d.count}</b>
                </div>
                <div className="mt-1 h-2 rounded bg-paper">
                  <div
                    className="h-2 rounded bg-teal"
                    style={{ width: `${(d.count / maxDept) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {deptStats.length === 0 && <p className="text-sm text-ink-soft">No active departments yet.</p>}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-paper-raised p-4">
        <h3 className="font-display font-bold mb-3">Maintenance frequency by category</h3>
        <div className="space-y-3">
          {catFreq.map((c: any) => (
            <div key={c.name}>
              <div className="flex justify-between text-sm">
                <span>{c.name}</span>
                <b>{c.count} ticket(s)</b>
              </div>
              <div className="mt-1 h-2 rounded bg-paper">
                <div
                  className="h-2 rounded bg-status-maintenance"
                  style={{ width: `${(c.count / maxCat) * 100}%` }}
                />
              </div>
            </div>
          ))}
          {catFreq.length === 0 && <p className="text-sm text-ink-soft">No categories yet.</p>}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-paper-raised p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display font-bold">Shared resource booking heatmap (08:00–18:00)</h3>
          <form method="get" className="flex items-center gap-2 text-sm">
            <input type="date" name="date" defaultValue={heatmapDate} className="rounded border border-border px-2 py-1" />
            <button type="submit" className="rounded bg-teal px-3 py-1 text-white">Go</button>
          </form>
        </div>
        {bookableAssets.length === 0 ? (
          <p className="text-sm text-ink-soft">No bookable resources registered.</p>
        ) : (
          <div className="space-y-1">
            <div className="grid text-center text-xs text-ink-soft" style={{ gridTemplateColumns: "120px repeat(11, 1fr)" }}>
              <span className="text-left font-semibold">Resource</span>
              {hours.map((h) => (
                <span key={h}>{h > 12 ? `${h - 12}p` : `${h}a`}</span>
              ))}
            </div>
            {bookableAssets.map((a: any) => (
              <div key={a.id} className="grid items-center gap-1" style={{ gridTemplateColumns: "120px repeat(11, 1fr)" }}>
                <span className="truncate text-xs">{a.name}</span>
                {hours.map((h) => (
                  <div key={h} className={`h-4 rounded border border-border ${densityLevel(a.id, h)}`} title={`${a.name} @ ${h}:00`} />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-paper-raised p-4">
          <h3 className="font-display font-bold mb-3">Due for maintenance ({dueForMaintenance.length})</h3>
          <div className="space-y-2 text-sm">
            {dueForMaintenance.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between border-b border-border pb-2">
                <div>
                  <b>{a.name}</b> <AssetTagChip tag={a.asset_tag} />
                  <div className="text-xs text-ink-soft">Condition: {a.condition} · {a.location}</div>
                </div>
              </div>
            ))}
            {dueForMaintenance.length === 0 && <p className="text-ink-soft">Nothing flagged.</p>}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-paper-raised p-4">
          <h3 className="font-display font-bold mb-3">Nearing retirement ({nearingRetirement.length})</h3>
          <div className="space-y-2 text-sm">
            {nearingRetirement.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between border-b border-border pb-2">
                <div>
                  <b>{a.name}</b> <AssetTagChip tag={a.asset_tag} />
                  <div className="text-xs text-ink-soft">Acquired {a.acquisition_date}</div>
                </div>
              </div>
            ))}
            {nearingRetirement.length === 0 && <p className="text-ink-soft">Nothing flagged.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
