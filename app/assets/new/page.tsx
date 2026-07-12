// Owner: shared (Asset Registration) — PRD 5.4
import { createClient } from "@/lib/supabase/server";
import { generateAssetTag } from "@/lib/business-logic";
import { redirect } from "next/navigation";

async function createAsset(formData: FormData) {
  "use server";
  const supabase = createClient();

  const name = (formData.get("name") as string)?.trim();
  const categoryId = (formData.get("category_id") as string) || null;
  const serialNumber = (formData.get("serial_number") as string) || null;
  const acquisitionDate = (formData.get("acquisition_date") as string) || null;
  const acquisitionCostRaw = formData.get("acquisition_cost") as string;
  const acquisitionCost = acquisitionCostRaw ? Number(acquisitionCostRaw) : null;
  const condition = (formData.get("condition") as string) || null;
  const location = (formData.get("location") as string) || null;
  const photoUrl = (formData.get("photo_url") as string) || null; // Storage fallback: plain URL field
  const isBookable = formData.get("is_bookable") === "on";

  if (!name) return;

  const assetTag = await generateAssetTag(supabase);

  const { data: inserted, error } = await supabase
    .from("assets")
    .insert({
      asset_tag: assetTag,
      name,
      category_id: categoryId,
      serial_number: serialNumber,
      acquisition_date: acquisitionDate,
      acquisition_cost: acquisitionCost,
      condition,
      location,
      photo_url: photoUrl,
      is_bookable: isBookable,
      status: "Available",
    })
    .select("id")
    .single();

  if (error || !inserted) return;

  redirect(`/assets/${inserted.id}`);
}

export default async function NewAssetPage() {
  const supabase = createClient();
  const { data: categories } = await supabase.from("categories").select("id, name").order("name");

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-4">Register Asset</h1>
      <form action={createAsset} className="max-w-xl space-y-3 rounded-lg border border-border bg-paper-raised p-6">
        <div>
          <label className="mb-1 block text-sm text-ink-soft">Name</label>
          <input name="name" required className="w-full rounded border border-border px-3 py-2" />
        </div>

        <div>
          <label className="mb-1 block text-sm text-ink-soft">Category</label>
          <select name="category_id" className="w-full rounded border border-border px-3 py-2">
            <option value="">None</option>
            {categories?.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm text-ink-soft">Serial Number</label>
            <input name="serial_number" className="w-full rounded border border-border px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-ink-soft">Condition</label>
            <select name="condition" className="w-full rounded border border-border px-3 py-2">
              <option value="">Select</option>
              <option>New</option>
              <option>Good</option>
              <option>Fair</option>
              <option>Poor</option>
              <option>Damaged</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm text-ink-soft">Acquisition Date</label>
            <input type="date" name="acquisition_date" className="w-full rounded border border-border px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-ink-soft">Acquisition Cost</label>
            <input type="number" step="0.01" name="acquisition_cost" className="w-full rounded border border-border px-3 py-2" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-ink-soft">Location</label>
          <input name="location" className="w-full rounded border border-border px-3 py-2" />
        </div>

        <div>
          <label className="mb-1 block text-sm text-ink-soft">Photo URL (fallback — no upload wired yet)</label>
          <input name="photo_url" placeholder="https://..." className="w-full rounded border border-border px-3 py-2" />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_bookable" />
          Bookable resource (shows up in Resource Booking)
        </label>

        <button type="submit" className="rounded bg-teal px-4 py-2 text-white">
          Register Asset
        </button>
      </form>
    </div>
  );
}
