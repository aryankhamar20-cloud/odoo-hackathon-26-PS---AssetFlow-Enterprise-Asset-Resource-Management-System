// Owner: Dhruv
// Departments tab — Name, Head (FK -> employee), Parent Department (self-ref, nullable), Status.
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function createDepartment(formData: FormData) {
  "use server";
  const supabase = createClient();
  const name = formData.get("name") as string;
  const headEmployeeId = (formData.get("head_employee_id") as string) || null;
  const parentDepartmentId = (formData.get("parent_department_id") as string) || null;

  await supabase.from("departments").insert({
    name,
    head_employee_id: headEmployeeId,
    parent_department_id: parentDepartmentId,
    status: "active",
  });
  revalidatePath("/org-setup/departments");
}

export default async function DepartmentsTab() {
  const supabase = createClient();
  const [{ data: departments }, { data: employees }] = await Promise.all([
    supabase.from("departments").select("*").order("created_at", { ascending: false }),
    supabase.from("employees").select("id, name"),
  ]);

  return (
    <div>
      <h2 className="font-display text-xl font-bold mb-3">Departments</h2>

      <form action={createDepartment} className="mb-6 flex flex-wrap gap-2 rounded-lg border border-border bg-paper-raised p-4">
        <input name="name" placeholder="Department name" required className="rounded border border-border px-3 py-2" />
        <select name="head_employee_id" className="rounded border border-border px-3 py-2">
          <option value="">Head (optional)</option>
          {employees?.map((e: any) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
        <select name="parent_department_id" className="rounded border border-border px-3 py-2">
          <option value="">Parent department (optional)</option>
          {departments?.map((d: any) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <button type="submit" className="rounded bg-teal px-3 py-2 text-white">Add Department</button>
      </form>

      <table className="w-full border-collapse overflow-hidden rounded-lg border border-border bg-paper-raised">
        <thead>
          <tr className="bg-paper text-left text-sm text-ink-soft">
            <th className="p-3">Name</th>
            <th className="p-3">Head</th>
            <th className="p-3">Parent</th>
            <th className="p-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {departments?.map((d: any) => {
            const head = employees?.find((e: any) => e.id === d.head_employee_id);
            const parent = departments?.find((p: any) => p.id === d.parent_department_id);
            return (
              <tr key={d.id} className="border-t border-border">
                <td className="p-3">{d.name}</td>
                <td className="p-3">{head?.name ?? "—"}</td>
                <td className="p-3">{parent?.name ?? "—"}</td>
                <td className="p-3">{d.status}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
