import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rejectTransfer, logActivity } from "@/lib/business-logic";
import { getCurrentEmployee } from "@/lib/auth";

export async function POST(req: Request) {
  const supabase = createClient();
  const actor = await getCurrentEmployee(supabase);
  if (!actor) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  if (!["asset_manager", "department_head", "admin"].includes(actor.role)) {
    return NextResponse.json({ error: "Not authorized to reject transfers" }, { status: 403 });
  }

  const { transferRequestId } = await req.json();
  await rejectTransfer(supabase, transferRequestId, actor.id);
  await logActivity(supabase, "Reject Asset Transfer", `Rejected a pending transfer request.`, actor.id, actor.name);
  return NextResponse.json({ ok: true });
}
