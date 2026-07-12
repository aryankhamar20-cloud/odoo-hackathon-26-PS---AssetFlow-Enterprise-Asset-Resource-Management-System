import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAuditItem, logActivity } from "@/lib/business-logic";
import { getCurrentEmployee } from "@/lib/auth";

const ALLOWED = ["Verified", "Missing", "Damaged"];

export async function POST(req: Request) {
  const supabase = createClient();
  const actor = await getCurrentEmployee(supabase);
  if (!actor) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  if (!["asset_manager", "admin"].includes(actor.role)) {
    return NextResponse.json({ error: "Only Asset Manager / Admin can record audit checks" }, { status: 403 });
  }

  const { auditItemId, verificationStatus, notes } = await req.json();
  if (!ALLOWED.includes(verificationStatus)) {
    return NextResponse.json({ error: "Invalid check status" }, { status: 400 });
  }

  const { error } = await checkAuditItem(supabase, auditItemId, verificationStatus, actor.id, notes);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logActivity(
    supabase,
    "Audit Item Checked",
    `Marked an audited asset as "${verificationStatus}".`,
    actor.id,
    actor.name
  );
  return NextResponse.json({ ok: true });
}
