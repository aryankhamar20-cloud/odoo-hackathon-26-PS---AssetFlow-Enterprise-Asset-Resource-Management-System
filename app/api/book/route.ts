import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { bookResource } from "@/lib/business-logic";

export async function POST(req: Request) {
  const { resourceAssetId, startTime, endTime, employeeId } = await req.json();
  const supabase = createClient();
  const result = await bookResource(supabase, resourceAssetId, startTime, endTime, employeeId);
  return NextResponse.json(result, { status: result.blocked ? 409 : 200 });
}
