import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { startMaintenanceProgress } from "@/lib/business-logic";

export async function POST(req: Request) {
  const { requestId } = await req.json();
  const supabase = createClient();
  await startMaintenanceProgress(supabase, requestId);
  return NextResponse.json({ ok: true });
}
