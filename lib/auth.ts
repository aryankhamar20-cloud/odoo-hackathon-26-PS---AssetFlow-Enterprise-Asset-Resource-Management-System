// Shared helper: resolve the currently logged-in employee (id, name, role)
// from the Supabase auth session. Used anywhere a page/action needs to know
// "who is doing this" — allocation requester, transfer requester, maintenance
// approver, etc. Never trust a client-submitted employee id for this.
import type { SupabaseClient } from "@supabase/supabase-js";

export interface CurrentEmployee {
  id: string;
  name: string;
  role: "employee" | "department_head" | "asset_manager" | "admin";
}

export async function getCurrentEmployee(
  supabase: SupabaseClient
): Promise<CurrentEmployee | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("employees")
    .select("id, name, role")
    .eq("auth_user_id", user.id)
    .single();

  if (!data) return null;
  return data as CurrentEmployee;
}
