import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { assetId, issueDescription, priority, photoUrl, employeeId } = await req.json();
  const supabase = createClient();

  const { error } = await supabase.from("maintenance_requests").insert({
    asset_id: assetId,
    raised_by_employee_id: employeeId,
    issue_description: issueDescription,
    priority,
    photo_url: photoUrl || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
