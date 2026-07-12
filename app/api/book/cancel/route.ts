import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cancelBooking, logActivity } from "@/lib/business-logic";
import { getCurrentEmployee } from "@/lib/auth";

export async function POST(req: Request) {
  const supabase = createClient();
  const actor = await getCurrentEmployee(supabase);
  if (!actor) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { bookingId } = await req.json();

  // Only the original booker or a manager can cancel — same rule as reschedule.
  const { data: booking } = await supabase
    .from("bookings")
    .select("booked_by_employee_id")
    .eq("id", bookingId)
    .single();

  const isOwner = booking?.booked_by_employee_id === actor.id;
  const isManager = ["asset_manager", "department_head", "admin"].includes(actor.role);
  if (!isOwner && !isManager) {
    return NextResponse.json({ error: "Not authorized to cancel this booking" }, { status: 403 });
  }

  await cancelBooking(supabase, bookingId);
  await logActivity(supabase, "Cancel Resource Booking", `Cancelled a booking.`, actor.id, actor.name);
  return NextResponse.json({ ok: true });
}
