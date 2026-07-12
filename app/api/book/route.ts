import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { bookResource, logActivity } from "@/lib/business-logic";
import { getCurrentEmployee } from "@/lib/auth";

// Any authenticated employee can book a shared resource — but the booker
// is always the session's own employee id, never a client-submitted one,
// so nobody can book a slot "as" someone else.
export async function POST(req: Request) {
  const supabase = createClient();
  const actor = await getCurrentEmployee(supabase);
  if (!actor) {
    return NextResponse.json({ blocked: true, message: "Not logged in" }, { status: 401 });
  }

  const { resourceAssetId, startTime, endTime } = await req.json();
  const result = await bookResource(supabase, resourceAssetId, startTime, endTime, actor.id);

  if (!result.blocked) {
    const { data: asset } = await supabase.from("assets").select("name").eq("id", resourceAssetId).single();
    await logActivity(
      supabase,
      "Book Shared Resource",
      `Booked ${asset?.name ?? "a resource"} from ${startTime} to ${endTime}.`,
      actor.id,
      actor.name
    );
  }

  return NextResponse.json(result, { status: result.blocked ? 409 : 200 });
}
