import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { approveMaintenance, logActivity } from "@/lib/business-logic";
import { getCurrentEmployee } from "@/lib/auth";

// Asset Manager / Admin only, per the role table.
export async function POST(req: Request) {
  const supabase = createClient();
  const actor = await getCurrentEmployee(supabase);
  if (!actor) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  if (!["asset_manager", "admin"].includes(actor.role)) {
    return NextResponse.json({ error: "Only Asset Manager / Admin can approve" }, { status: 403 });
  }

  const { requestId } = await req.json();
  await approveMaintenance(supabase, requestId, actor.id);
  await logActivity(supabase, "Approve Maintenance", `Approved a maintenance request — asset set to Under Maintenance.`, actor.id, actor.name);
  return NextResponse.json({ ok: true });
}
