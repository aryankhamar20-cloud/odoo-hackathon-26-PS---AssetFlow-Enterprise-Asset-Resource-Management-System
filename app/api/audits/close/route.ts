import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { closeAuditCycle, logActivity } from "@/lib/business-logic";
import { getCurrentEmployee } from "@/lib/auth";

export async function POST(req: Request) {
  const supabase = createClient();
  const actor = await getCurrentEmployee(supabase);
  if (!actor) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  if (!["asset_manager", "admin"].includes(actor.role)) {
    return NextResponse.json({ error: "Only Asset Manager / Admin can close an audit" }, { status: 403 });
  }

  const { auditCycleId } = await req.json();
  const result = await closeAuditCycle(supabase, auditCycleId);

  await logActivity(
    supabase,
    "Close Audit Cycle",
    `Closed an audit cycle. ${result.missingCount} asset(s) marked Lost.`,
    actor.id,
    actor.name
  );
  return NextResponse.json({ ok: true, ...result });
}
