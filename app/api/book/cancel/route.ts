import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cancelBooking } from "@/lib/business-logic";

export async function POST(req: Request) {
  const { bookingId } = await req.json();
  const supabase = createClient();
  await cancelBooking(supabase, bookingId);
  return NextResponse.json({ ok: true });
}
