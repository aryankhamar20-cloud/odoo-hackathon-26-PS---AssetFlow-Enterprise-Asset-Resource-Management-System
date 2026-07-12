import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { allocateAsset, logActivity } from "@/lib/business-logic";
import { getCurrentEmployee } from "@/lib/auth";

// NOTE: the demo script has an Employee (not just Asset Manager) trigger the
// double-allocate conflict directly, so this intentionally does NOT restrict
// by role — only requires a real session. The conflict rule itself is the
// thing being enforced/demonstrated here.
export async function POST(req: Request) {
  const supabase = createClient();
  const actor = await getCurrentEmployee(supabase);
  if (!actor) {
    return NextResponse.json({ blocked: true, message: "Not logged in" }, { status: 401 });
  }

  const { assetId, employeeId, departmentId, expectedReturn } = await req.json();
  const result = await allocateAsset(supabase, assetId, { employeeId, departmentId }, expectedReturn);

  if (!result.blocked) {
    const { data: asset } = await supabase.from("assets").select("name, asset_tag").eq("id", assetId).single();
    let targetName = "an employee";
    if (employeeId) {
      const { data: emp } = await supabase.from("employees").select("name").eq("id", employeeId).single();
      if (emp?.name) targetName = emp.name;
    } else if (departmentId) {
      const { data: dept } = await supabase.from("departments").select("name").eq("id", departmentId).single();
      if (dept?.name) targetName = `${dept.name} (dept.)`;
    }
    await logActivity(
      supabase,
      "Allocate Asset",
      `Allocated ${asset?.name ?? "asset"} (${asset?.asset_tag ?? assetId}) to ${targetName}.`,
      actor.id,
      actor.name
    );
  }

  return NextResponse.json(result, { status: result.blocked ? 409 : 200 });
}
