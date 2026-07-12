import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assignTechnician, logActivity } from "@/lib/business-logic";
import { getCurrentEmployee } from "@/lib/auth";

export async function POST(req: Request) {
  const supabase = createClient();
  const actor = await getCurrentEmployee(supabase);
  if (!actor) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  if (!["asset_manager", "admin"].includes(actor.role)) {
    return NextResponse.json({ error: "Only Asset Manager / Admin can assign a technician" }, { status: 403 });
  }

  const { requestId, technicianName } = await req.json();
  await assignTechnician(supabase, requestId, technicianName);
  await logActivity(supabase, "Assign Technician", `Assigned technician "${technicianName}" to a maintenance request.`, actor.id, actor.name);
  return NextResponse.json({ ok: true });
}
