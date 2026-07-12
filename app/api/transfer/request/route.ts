import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requestTransfer, logActivity } from "@/lib/business-logic";
import { getCurrentEmployee } from "@/lib/auth";

export async function POST(req: Request) {
  const { assetId, toEmployeeId } = await req.json();
  const supabase = createClient();

  const actor = await getCurrentEmployee(supabase);
  if (!actor) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { data: asset } = await supabase
    .from("assets")
    .select("name, asset_tag, current_holder_employee_id")
    .eq("id", assetId)
    .single();

  await requestTransfer(
    supabase,
    assetId,
    asset?.current_holder_employee_id ?? null,
    toEmployeeId,
    actor.id
  );

  const { data: toEmp } = await supabase.from("employees").select("name").eq("id", toEmployeeId).single();
  await logActivity(
    supabase,
    "Request Asset Transfer",
    `Requested transfer of ${asset?.name ?? "asset"} (${asset?.asset_tag ?? assetId}) to ${toEmp?.name ?? "an employee"}.`,
    actor.id,
    actor.name
  );

  return NextResponse.json({ ok: true });
}
