import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { approveMaintenance } from "@/lib/business-logic";

export async function POST(req: Request) {
  const { requestId, approverEmployeeId } = await req.json();
  const supabase = createClient();
  await approveMaintenance(supabase, requestId, approverEmployeeId);
  return NextResponse.json({ ok: true });
}
