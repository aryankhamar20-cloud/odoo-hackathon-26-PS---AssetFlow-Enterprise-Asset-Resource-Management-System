import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rejectMaintenance } from "@/lib/business-logic";

export async function POST(req: Request) {
  const { requestId, approverEmployeeId } = await req.json();
  const supabase = createClient();
  await rejectMaintenance(supabase, requestId, approverEmployeeId);
  return NextResponse.json({ ok: true });
}
