import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAuditCycle, logActivity } from "@/lib/business-logic";
import { getCurrentEmployee } from "@/lib/auth";

export async function POST(req: Request) {
  const supabase = createClient();
  const actor = await getCurrentEmployee(supabase);
  if (!actor) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  if (!["asset_manager", "admin"].includes(actor.role)) {
    return NextResponse.json({ error: "Only Asset Manager / Admin can start an audit" }, { status: 403 });
  }

  const { name, departmentId, location, dateRangeStart, dateRangeEnd, leadAuditorEmployeeId } = await req.json();

  if (!name || (!departmentId && !location)) {
    return NextResponse.json({ error: "Name and a department or location scope are required." }, { status: 400 });
  }

  try {
    const cycleId = await createAuditCycle(
      supabase,
      name,
      { departmentId: departmentId || undefined, location: location || undefined },
      dateRangeStart || null,
      dateRangeEnd || null,
      leadAuditorEmployeeId || null
    );
    await logActivity(
      supabase,
      "Create Audit Cycle",
      `Started audit cycle "${name}" (scope: ${departmentId ? "department" : "location"}).`,
      actor.id,
      actor.name
    );
    return NextResponse.json({ ok: true, cycleId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Could not create audit cycle." }, { status: 400 });
  }
}
