import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rescheduleBooking, logActivity } from "@/lib/business-logic";
import { getCurrentEmployee } from "@/lib/auth";

export async function POST(req: Request) {
  const supabase = createClient();
  const actor = await getCurrentEmployee(supabase);
  if (!actor) {
    return NextResponse.json({ blocked: true, message: "Not logged in" }, { status: 401 });
  }

  const { bookingId, startTime, endTime } = await req.json();

  // Only the original booker or a manager can reschedule — enforced here,
  // not just by hiding the button.
  const { data: booking } = await supabase
    .from("bookings")
    .select("booked_by_employee_id")
    .eq("id", bookingId)
    .single();

  const isOwner = booking?.booked_by_employee_id === actor.id;
  const isManager = ["asset_manager", "department_head", "admin"].includes(actor.role);
  if (!isOwner && !isManager) {
    return NextResponse.json({ blocked: true, message: "Not authorized to reschedule this booking" }, { status: 403 });
  }

  const result = await rescheduleBooking(supabase, bookingId, startTime, endTime);
  if (!result.blocked) {
    await logActivity(supabase, "Reschedule Booking", `Rescheduled a booking to ${startTime}.`, actor.id, actor.name);
  }
  return NextResponse.json(result, { status: result.blocked ? 409 : 200 });
}
