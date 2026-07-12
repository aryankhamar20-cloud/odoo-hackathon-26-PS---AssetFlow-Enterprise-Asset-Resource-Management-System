import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { startMaintenanceProgress, logActivity } from "@/lib/business-logic";
import { getCurrentEmployee } from "@/lib/auth";

export async function POST(req: Request) {
  const supabase = createClient();
  const actor = await getCurrentEmployee(supabase);
  if (!actor) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  if (!["asset_manager", "admin"].includes(actor.role)) {
    return NextResponse.json({ error: "Only Asset Manager / Admin can update progress" }, { status: 403 });
  }

  const { requestId } = await req.json();
  await startMaintenanceProgress(supabase, requestId);
  await logActivity(supabase, "Start Maintenance Progress", `Marked a maintenance request as In Progress.`, actor.id, actor.name);
  return NextResponse.json({ ok: true });
}
