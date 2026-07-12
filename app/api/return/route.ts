import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { returnAsset } from "@/lib/business-logic";

export async function POST(req: Request) {
  const { allocationId, assetId, conditionNote } = await req.json();
  const supabase = createClient();
  await returnAsset(supabase, allocationId, assetId, conditionNote);
  return NextResponse.json({ ok: true });
}
