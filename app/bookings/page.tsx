import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "@/lib/auth";
import { computeBookingStatus } from "@/lib/business-logic";
import { BookResourceForm } from "@/components/BookResourceForm";
import { CancelBookingButton } from "@/components/CancelBookingButton";
import { RescheduleBookingButton } from "@/components/RescheduleBookingButton";
import { AssetTagChip } from "@/components/AssetTagChip";

export default async function BookingsPage() {
  const supabase = createClient();

  const [{ data: bookableAssets }, { data: bookings }, currentEmployee] = await Promise.all([
    supabase.from("assets").select("id, name, asset_tag").eq("is_bookable", true).order("name"),
    supabase
      .from("bookings")
      .select("id, start_time, end_time, status, assets:resource_asset_id(name, asset_tag), employees:booked_by_employee_id(name)")
      .order("start_time", { ascending: true }),
    getCurrentEmployee(supabase),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Resource Booking</h1>

      <BookResourceForm assets={bookableAssets ?? []} employeeId={currentEmployee?.id ?? null} />

      <table className="w-full border-collapse overflow-hidden rounded-lg border border-border bg-paper-raised">
        <thead>
          <tr className="bg-paper text-left text-sm text-ink-soft">
            <th className="p-3">Resource</th>
            <th className="p-3">Booked by</th>
            <th className="p-3">Time</th>
            <th className="p-3">Status</th>
            <th className="p-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {bookings?.map((b: any) => {
            const status = computeBookingStatus(b.start_time, b.end_time, b.status);
            const fmt = (iso: string) => new Date(iso).toLocaleString([], { dateStyle: "short", timeStyle: "short" });
            return (
              <tr key={b.id} className="border-t border-border">
                <td className="p-3">{b.assets?.name} <AssetTagChip tag={b.assets?.asset_tag} /></td>
                <td className="p-3">{b.employees?.name ?? "—"}</td>
                <td className="p-3">{fmt(b.start_time)} – {fmt(b.end_time)}</td>
                <td className="p-3">{status}</td>
                <td className="p-3">
                  {status === "Upcoming" && (
                    <div className="flex flex-col gap-1">
                      <div className="flex gap-1">
                        <CancelBookingButton bookingId={b.id} />
                        <RescheduleBookingButton bookingId={b.id} />
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
          {(!bookings || bookings.length === 0) && (
            <tr><td className="p-3 text-ink-soft" colSpan={5}>No bookings yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
