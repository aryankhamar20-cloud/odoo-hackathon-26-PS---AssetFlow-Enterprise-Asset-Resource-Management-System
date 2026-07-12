// Owner: Aayushi
// Employee Directory tab — Name, Email, Department, Role, Status.
// This is the ONLY screen that changes `role`. Wired to changeEmployeeRole()
// from lib/business-logic.ts, which blocks self-elevation and non-admins.
import { createClient } from "@/lib/supabase/server";
import { changeEmployeeRole, logActivity } from "@/lib/business-logic";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function updateRole(formData: FormData) {
  "use server";
  const supabase = createClient();
  const acting = await requireRole(supabase, ["admin"]);
  const targetEmployeeId = formData.get("employee_id") as string;
  const newRole = formData.get("role") as
    | "employee"
    | "department_head"
    | "asset_manager"
    | "admin";

  const { data: target } = await supabase.from("employees").select("name").eq("id", targetEmployeeId).single();
  await changeEmployeeRole(supabase, acting.id, targetEmployeeId, newRole);
  await logActivity(
    supabase,
    "Update Employee Role",
    `Changed ${target?.name ?? "an employee"}'s role to ${newRole}.`,
    acting.id,
    acting.name
  );
  revalidatePath("/org-setup/employees");
}

async function updateDepartment(formData: FormData) {
  "use server";
  const supabase = createClient();
  const acting = await requireRole(supabase, ["admin"]);
  const targetEmployeeId = formData.get("employee_id") as string;
  const departmentId = (formData.get("department_id") as string) || null;

  const { data: target } = await supabase.from("employees").select("name").eq("id", targetEmployeeId).single();
  await supabase.from("employees").update({ department_id: departmentId }).eq("id", targetEmployeeId);
  await logActivity(
    supabase,
    "Update Employee Department",
    `Reassigned ${target?.name ?? "an employee"}'s department.`,
    acting.id,
    acting.name
  );
  revalidatePath("/org-setup/employees");
}

export default async function EmployeeDirectoryTab() {
  const supabase = createClient();
  const acting = await requireRole(supabase, ["admin"]);

  const [{ data: employees }, { data: departments }] = await Promise.all([
    supabase
      .from("employees")
      .select("id, name, email, role, status, department_id")
      .order("created_at", { ascending: false }),
    supabase.from("departments").select("id, name").order("name"),
  ]);

  const roles = ["employee", "department_head", "asset_manager", "admin"];

  return (
    <div>
      <h2 className="font-display text-xl font-bold mb-3">Employee Directory</h2>
      <table className="w-full border-collapse overflow-hidden rounded-lg border border-border bg-paper-raised">
        <thead>
          <tr className="bg-paper text-left text-sm text-ink-soft">
            <th className="p-3">Name</th>
            <th className="p-3">Email</th>
            <th className="p-3">Department</th>
            <th className="p-3">Role</th>
            <th className="p-3">Status</th>
            <th className="p-3">Change role</th>
          </tr>
        </thead>
        <tbody>
          {employees?.map((e: any) => {
            const isSelf = acting.id === e.id;
            const currentDept = departments?.find((d: any) => d.id === e.department_id);
            return (
              <tr key={e.id} className="border-t border-border">
                <td className="p-3">{e.name}</td>
                <td className="p-3">{e.email}</td>
                <td className="p-3">
                  <form action={updateDepartment} className="flex items-center gap-1">
                    <input type="hidden" name="employee_id" value={e.id} />
                    <select
                      name="department_id"
                      defaultValue={e.department_id ?? ""}
                      className="rounded border border-border px-2 py-1 text-xs"
                    >
                      <option value="">Unassigned</option>
                      {departments?.map((d: any) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                    <button type="submit" className="rounded border border-border px-2 py-1 text-xs">Save</button>
                  </form>
                  {!currentDept && !e.department_id && (
                    <span className="sr-only">Unassigned</span>
                  )}
                </td>
                <td className="p-3 capitalize">{e.role.replace("_", " ")}</td>
                <td className="p-3">{e.status}</td>
                <td className="p-3">
                  {isSelf ? (
                    <span className="text-xs text-ink-soft">Can't change your own role</span>
                  ) : (
                    <form action={updateRole} className="flex gap-2">
                      <input type="hidden" name="employee_id" value={e.id} />
                      <select name="role" defaultValue={e.role} className="rounded border border-border px-2 py-1 text-sm">
                        {roles.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <button type="submit" className="rounded bg-teal px-2 py-1 text-xs text-white">Save</button>
                    </form>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
