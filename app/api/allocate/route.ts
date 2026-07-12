import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { allocateAsset } from "@/lib/business-logic";

export async function POST(req: Request) {
  const { assetId, employeeId, expectedReturn } = await req.json();
  const supabase = createClient();
  const result = await allocateAsset(supabase, assetId, employeeId, expectedReturn);
  return NextResponse.json(result, { status: result.blocked ? 409 : 200 });
}
