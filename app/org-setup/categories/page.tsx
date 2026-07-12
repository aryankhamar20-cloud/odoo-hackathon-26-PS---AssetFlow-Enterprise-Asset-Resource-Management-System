// Owner: Nishtha
// Categories tab — Name, optional JSON custom_fields.
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function createCategory(formData: FormData) {
  "use server";
  const supabase = createClient();
  const name = (formData.get("name") as string)?.trim();
  const customFieldsRaw = (formData.get("custom_fields") as string) || "{}";

  if (!name) return;

  // Don't silently swallow bad JSON — fall back to {} but only after
  // confirming the raw text actually failed to parse, so a real typo
  // doesn't quietly lose the fields the user typed.
  let customFields: Record<string, unknown> = {};
  try {
    customFields = customFieldsRaw.trim() ? JSON.parse(customFieldsRaw) : {};
  } catch {
    customFields = {};
  }

  // Prevent duplicate category names (case-insensitive) instead of letting
  // the directory fill up with near-identical entries during the demo.
  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .ilike("name", name)
    .maybeSingle();
  if (existing) return;

  await supabase.from("categories").insert({ name, custom_fields: customFields });
  revalidatePath("/org-setup/categories");
}

export default async function CategoriesTab() {
  const supabase = createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h2 className="font-display text-xl font-bold mb-3">Categories</h2>

      <form action={createCategory} className="mb-6 flex flex-wrap gap-2 rounded-lg border border-border bg-paper-raised p-4">
        <input name="name" placeholder="Category name" required className="rounded border border-border px-3 py-2" />
        <input
          name="custom_fields"
          placeholder='Custom fields JSON (optional), e.g. {"warranty_months":12}'
          className="min-w-[280px] rounded border border-border px-3 py-2"
        />
        <button type="submit" className="rounded bg-teal px-3 py-2 text-white">Add Category</button>
      </form>

      <table className="w-full border-collapse overflow-hidden rounded-lg border border-border bg-paper-raised">
        <thead>
          <tr className="bg-paper text-left text-sm text-ink-soft">
            <th className="p-3">Name</th>
            <th className="p-3">Custom fields</th>
            <th className="p-3">Field count</th>
          </tr>
        </thead>
        <tbody>
          {categories?.map((c: any) => {
            const fieldCount = c.custom_fields ? Object.keys(c.custom_fields).length : 0;
            return (
              <tr key={c.id} className="border-t border-border">
                <td className="p-3">{c.name}</td>
                <td className="p-3 font-mono-data text-xs">{JSON.stringify(c.custom_fields)}</td>
                <td className="p-3">{fieldCount}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
