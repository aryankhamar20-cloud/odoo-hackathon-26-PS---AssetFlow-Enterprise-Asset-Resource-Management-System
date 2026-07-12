// Owner: Aayushi
// Employee Directory tab — Name, Email, Department, Role, Status.
// This is the ONLY screen that changes `role`. Wired to changeEmployeeRole()
// from lib/business-logic.ts, which blocks self-elevation and non-admins.
import { createClient } from "@/lib/supabase/server";
import { changeEmployeeRole } from "@/lib/business-logic";
import { revalidatePath } from "next/cache";

async function updateRole(formData: FormData) {
  "use server";
  const supabase = createClient();
  const actingEmployeeId = formData.get("acting_employee_id") as string; // TODO: pull from session once auth wiring lands
  const targetEmployeeId = formData.get("employee_id") as string;
  const newRole = formData.get("role") as
    | "employee"
    | "department_head"
    | "asset_manager"
    | "admin";

  await changeEmployeeRole(supabase, actingEmployeeId, targetEmployeeId, newRole);
  revalidatePath("/org-setup/employees");
}

export default async function EmployeeDirectoryTab() {
  const supabase = createClient();
  const { data: employees } = await supabase
    .from("employees")
    .select("id, name, email, role, status, department_id")
    .order("created_at", { ascending: false });

  const roles = ["employee", "department_head", "asset_manager", "admin"];

  return (
    <div>
      <h2 className="font-display text-xl font-bold mb-3">Employee Directory</h2>
      <table className="w-full border-collapse overflow-hidden rounded-lg border border-border bg-paper-raised">
        <thead>
          <tr className="bg-paper text-left text-sm text-ink-soft">
            <th className="p-3">Name</th>
            <th className="p-3">Email</th>
            <th className="p-3">Role</th>
            <th className="p-3">Status</th>
            <th className="p-3">Change role</th>
          </tr>
        </thead>
        <tbody>
          {employees?.map((e: any) => (
            <tr key={e.id} className="border-t border-border">
              <td className="p-3">{e.name}</td>
              <td className="p-3">{e.email}</td>
              <td className="p-3 capitalize">{e.role.replace("_", " ")}</td>
              <td className="p-3">{e.status}</td>
              <td className="p-3">
                <form action={updateRole} className="flex gap-2">
                  {/* TODO: replace hidden acting_employee_id with the real logged-in admin's id from session */}
                  <input type="hidden" name="acting_employee_id" value="" />
                  <input type="hidden" name="employee_id" value={e.id} />
                  <select name="role" defaultValue={e.role} className="rounded border border-border px-2 py-1 text-sm">
                    {roles.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <button type="submit" className="rounded bg-teal px-2 py-1 text-xs text-white">Save</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
