import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { approveTransfer } from "@/lib/business-logic";
import { getCurrentEmployee } from "@/lib/auth";

// Asset Manager / Department Head only — enforced here, not just hidden in UI.
export async function POST(req: Request) {
  const { transferRequestId } = await req.json();
  const supabase = createClient();

  const actor = await getCurrentEmployee(supabase);
  if (!actor || !["asset_manager", "department_head", "admin"].includes(actor.role)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  await approveTransfer(supabase, transferRequestId, actor.id);
  return NextResponse.json({ ok: true });
}
