import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { returnAsset, logActivity } from "@/lib/business-logic";
import { getCurrentEmployee } from "@/lib/auth";

export async function POST(req: Request) {
  const supabase = createClient();
  const actor = await getCurrentEmployee(supabase);
  if (!actor) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { allocationId, assetId, conditionNote } = await req.json();
  await returnAsset(supabase, allocationId, assetId, conditionNote);

  const { data: asset } = await supabase.from("assets").select("name, asset_tag").eq("id", assetId).single();
  await logActivity(
    supabase,
    "Return Asset",
    `Returned ${asset?.name ?? "asset"} (${asset?.asset_tag ?? assetId}).${conditionNote ? ` Note: ${conditionNote}` : ""}`,
    actor.id,
    actor.name
  );

  return NextResponse.json({ ok: true });
}
