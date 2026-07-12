import { createClient } from "@/lib/supabase/server";
import { StatusChip } from "@/components/StatusChip";
import { AssetTagChip } from "@/components/AssetTagChip";
import { getCurrentEmployee } from "@/lib/auth";

const STATUSES = ["Available", "Allocated", "Reserved", "Under Maintenance", "Lost", "Retired", "Disposed"];

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; category?: string };
}) {
  const supabase = createClient();
  const q = searchParams.q?.trim() ?? "";
  const status = searchParams.status ?? "";
  const categoryId = searchParams.category ?? "";

  let query = supabase.from("assets").select("*, categories:category_id(name)").order("created_at", { ascending: false });

  if (q) {
    // Match on name OR asset_tag
    query = query.or(`name.ilike.%${q}%,asset_tag.ilike.%${q}%`);
  }
  if (status) {
    query = query.eq("status", status);
  }
  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const [{ data: assets }, { data: categories }, currentEmployee] = await Promise.all([
    query,
    supabase.from("categories").select("id, name").order("name"),
    getCurrentEmployee(supabase),
  ]);

  const hasFilters = q || status || categoryId;
  const canRegister = currentEmployee?.role === "asset_manager" || currentEmployee?.role === "admin";

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Asset Directory</h1>
        {canRegister && (
          <a href="/assets/new" className="rounded bg-teal px-3 py-2 text-white">
            Register Asset
          </a>
        )}
      </div>

      <form method="get" className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-paper-raised p-3">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by name or tag (AF-0001)"
          className="min-w-[220px] rounded border border-border px-3 py-2"
        />
        <select name="status" defaultValue={status} className="rounded border border-border px-3 py-2">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select name="category" defaultValue={categoryId} className="rounded border border-border px-3 py-2">
          <option value="">All categories</option>
          {categories?.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button type="submit" className="rounded bg-teal px-3 py-2 text-white">Filter</button>
        {hasFilters && (
          <a href="/assets" className="text-sm text-ink-soft underline">Clear</a>
        )}
      </form>

      <table className="w-full border-collapse overflow-hidden rounded-lg border border-border bg-paper-raised">
        <thead>
          <tr className="bg-paper text-left text-sm text-ink-soft">
            <th className="p-3">Tag</th>
            <th className="p-3">Name</th>
            <th className="p-3">Category</th>
            <th className="p-3">Status</th>
            <th className="p-3">Location</th>
          </tr>
        </thead>
        <tbody>
          {assets?.map((a: any) => (
            <tr key={a.id} className="border-t border-border">
              <td className="p-3"><AssetTagChip tag={a.asset_tag} /></td>
              <td className="p-3">
                <a href={`/assets/${a.id}`} className="text-teal">{a.name}</a>
              </td>
              <td className="p-3">{a.categories?.name ?? "—"}</td>
              <td className="p-3"><StatusChip status={a.status} /></td>
              <td className="p-3">{a.location}</td>
            </tr>
          ))}
          {(!assets || assets.length === 0) && (
            <tr>
              <td className="p-3 text-ink-soft" colSpan={5}>
                {hasFilters ? (
                  <>No assets match these filters. <a href="/assets" className="text-teal underline">Clear filters</a>.</>
                ) : canRegister ? (
                  <>No assets registered yet. <a href="/assets/new" className="text-teal underline">Register the first one</a>.</>
                ) : (
                  <>No assets registered yet.</>
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
