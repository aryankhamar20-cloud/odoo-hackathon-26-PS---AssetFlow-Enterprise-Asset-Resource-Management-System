import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveMaintenance } from "@/lib/business-logic";

export async function POST(req: Request) {
  const { requestId } = await req.json();
  const supabase = createClient();
  await resolveMaintenance(supabase, requestId);
  return NextResponse.json({ ok: true });
}
