import { createClient } from "@/lib/supabase/server";
import { StatusChip } from "@/components/StatusChip";
import { AssetTagChip } from "@/components/AssetTagChip";

export default async function AssetsPage() {
  const supabase = createClient();
  const { data: assets } = await supabase.from("assets").select("*").order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Asset Directory</h1>
        <a href="/assets/new" className="rounded bg-teal px-3 py-2 text-white">
          Register Asset
        </a>
      </div>
      {/* TODO: search/filter bar */}
      <table className="w-full border-collapse overflow-hidden rounded-lg border border-border bg-paper-raised">
        <thead>
          <tr className="bg-paper text-left text-sm text-ink-soft">
            <th className="p-3">Tag</th>
            <th className="p-3">Name</th>
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
              <td className="p-3"><StatusChip status={a.status} /></td>
              <td className="p-3">{a.location}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
