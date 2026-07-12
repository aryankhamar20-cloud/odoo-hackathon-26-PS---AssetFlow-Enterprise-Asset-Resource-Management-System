import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/business-logic";
import { getCurrentEmployee } from "@/lib/auth";

export async function POST(req: Request) {
  const supabase = createClient();
  const actor = await getCurrentEmployee(supabase);
  if (!actor) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  // employeeId is deliberately NOT read from the request body — it's
  // always the session's own employee, so nobody can raise a request "as"
  // someone else.
  const { assetId, issueDescription, priority, photoUrl } = await req.json();

  const { error } = await supabase.from("maintenance_requests").insert({
    asset_id: assetId,
    raised_by_employee_id: actor.id,
    issue_description: issueDescription,
    priority,
    photo_url: photoUrl || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data: asset } = await supabase.from("assets").select("name, asset_tag").eq("id", assetId).single();
  await logActivity(
    supabase,
    "Raise Maintenance Request",
    `Raised a ${priority ?? ""} priority request for ${asset?.name ?? "asset"} (${asset?.asset_tag ?? assetId}): ${issueDescription}`,
    actor.id,
    actor.name
  );

  return NextResponse.json({ ok: true });
}
