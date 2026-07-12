import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assignTechnician } from "@/lib/business-logic";

export async function POST(req: Request) {
  const { requestId, technicianName } = await req.json();
  const supabase = createClient();
  await assignTechnician(supabase, requestId, technicianName);
  return NextResponse.json({ ok: true });
}
