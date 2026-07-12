import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { setAssetStatus, logActivity, type TerminalAssetStatus } from "@/lib/business-logic";
import { getCurrentEmployee } from "@/lib/auth";

const ALLOWED: TerminalAssetStatus[] = ["Lost", "Retired", "Disposed"];

export async function POST(req: Request) {
  const supabase = createClient();
  const actor = await getCurrentEmployee(supabase);
  if (!actor) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  if (!["asset_manager", "admin"].includes(actor.role)) {
    return NextResponse.json({ error: "Only Asset Manager / Admin can change this" }, { status: 403 });
  }

  const { assetId, status } = await req.json();
  if (!ALLOWED.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { error } = await setAssetStatus(supabase, assetId, status);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data: asset } = await supabase.from("assets").select("name, asset_tag").eq("id", assetId).single();
  await logActivity(
    supabase,
    "Change Asset Status",
    `Set ${asset?.name ?? "asset"} (${asset?.asset_tag ?? assetId}) to ${status}.`,
    actor.id,
    actor.name
  );

  return NextResponse.json({ ok: true });
}
