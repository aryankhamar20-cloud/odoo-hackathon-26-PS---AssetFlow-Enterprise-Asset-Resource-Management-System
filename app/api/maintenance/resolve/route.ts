import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveMaintenance, logActivity } from "@/lib/business-logic";
import { getCurrentEmployee } from "@/lib/auth";

export async function POST(req: Request) {
  const supabase = createClient();
  const actor = await getCurrentEmployee(supabase);
  if (!actor) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  if (!["asset_manager", "admin"].includes(actor.role)) {
    return NextResponse.json({ error: "Only Asset Manager / Admin can resolve" }, { status: 403 });
  }

  const { requestId } = await req.json();
  await resolveMaintenance(supabase, requestId);
  await logActivity(supabase, "Resolve Maintenance", `Resolved a maintenance request — asset set back to Available.`, actor.id, actor.name);
  return NextResponse.json({ ok: true });
}
