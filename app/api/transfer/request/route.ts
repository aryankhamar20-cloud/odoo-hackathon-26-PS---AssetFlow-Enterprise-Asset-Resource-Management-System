import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requestTransfer } from "@/lib/business-logic";
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
    .select("current_holder_employee_id")
    .eq("id", assetId)
    .single();

  await requestTransfer(
    supabase,
    assetId,
    asset?.current_holder_employee_id ?? null,
    toEmployeeId,
    actor.id
  );

  return NextResponse.json({ ok: true });
}
