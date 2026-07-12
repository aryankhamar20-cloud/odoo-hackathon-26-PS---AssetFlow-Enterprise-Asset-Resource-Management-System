// CRITICAL PATH — do not weaken these checks under time pressure.
// Every function here is meant to be called from a Server Action or an
// app/api/* route handler, i.e. it always runs server-side. Never
// replicate this logic client-side as the only guard — judges may hit
// the API directly.

import type { SupabaseClient } from "@supabase/supabase-js";

// ---------- Asset tag generation ----------
export async function generateAssetTag(supabase: SupabaseClient): Promise<string> {
  const { data, error } = await supabase.rpc("nextval_asset_tag_seq");
  if (error || data == null) {
    // Fallback if the RPC wasn't created yet: count-based tag so asset
    // creation is never blocked during the hackathon.
    const { count } = await supabase
      .from("assets")
      .select("id", { count: "exact", head: true });
    const next = (count ?? 0) + 1;
    return `AF-${String(next).padStart(4, "0")}`;
  }
  return `AF-${String(data).padStart(4, "0")}`;
}

// ---------- Allocation conflict check (CORE) ----------
export interface AllocateResult {
  blocked: boolean;
  message?: string;
  offerTransferRequest?: boolean;
}

export async function allocateAsset(
  supabase: SupabaseClient,
  assetId: string,
  employeeId: string,
  expectedReturn?: string
): Promise<AllocateResult> {
  const { data: asset, error } = await supabase
    .from("assets")
    .select("status, current_holder_employee_id")
    .eq("id", assetId)
    .single();

  if (error || !asset) {
    return { blocked: true, message: "Asset not found." };
  }

  if (asset.status === "Allocated" || asset.status === "Reserved") {
    let holderName = "another employee";
    if (asset.current_holder_employee_id) {
      const { data: holder } = await supabase
        .from("employees")
        .select("name")
        .eq("id", asset.current_holder_employee_id)
        .single();
      if (holder?.name) holderName = holder.name;
    }
    return {
      blocked: true,
      message: `Currently held by ${holderName}`,
      offerTransferRequest: true,
    };
  }

  const { error: insertError } = await supabase.from("allocations").insert({
    asset_id: assetId,
    employee_id: employeeId,
    expected_return_date: expectedReturn ?? null,
  });
  if (insertError) return { blocked: true, message: insertError.message };

  await supabase
    .from("assets")
    .update({ status: "Allocated", current_holder_employee_id: employeeId })
    .eq("id", assetId);

  return { blocked: false };
}

// ---------- Return flow ----------
export async function returnAsset(
  supabase: SupabaseClient,
  allocationId: string,
  assetId: string,
  conditionNote?: string
) {
  await supabase
    .from("allocations")
    .update({ returned_at: new Date().toISOString(), condition_checkin_note: conditionNote ?? null })
    .eq("id", allocationId);

  await supabase
    .from("assets")
    .update({ status: "Available", current_holder_employee_id: null, current_holder_department_id: null })
    .eq("id", assetId);
}

// ---------- Transfer workflow ----------
export async function requestTransfer(
  supabase: SupabaseClient,
  assetId: string,
  fromEmployeeId: string | null,
  toEmployeeId: string,
  requestedBy: string
) {
  return supabase.from("transfer_requests").insert({
    asset_id: assetId,
    from_employee_id: fromEmployeeId,
    to_employee_id: toEmployeeId,
    requested_by: requestedBy,
    status: "Requested",
  });
}

export async function approveTransfer(
  supabase: SupabaseClient,
  transferRequestId: string,
  approverEmployeeId: string
) {
  const { data: req, error } = await supabase
    .from("transfer_requests")
    .update({ status: "Approved", approved_by: approverEmployeeId })
    .eq("id", transferRequestId)
    .select("asset_id, to_employee_id")
    .single();
  if (error || !req) throw error ?? new Error("Transfer request not found");

  // Re-allocate: close old allocation, open new one, flip status.
  await supabase
    .from("allocations")
    .update({ returned_at: new Date().toISOString() })
    .eq("asset_id", req.asset_id)
    .is("returned_at", null);

  await supabase.from("allocations").insert({
    asset_id: req.asset_id,
    employee_id: req.to_employee_id,
  });

  await supabase
    .from("assets")
    .update({ status: "Allocated", current_holder_employee_id: req.to_employee_id })
    .eq("id", req.asset_id);

  await supabase
    .from("transfer_requests")
    .update({ status: "Re-allocated" })
    .eq("id", transferRequestId);
}

// ---------- Booking overlap check (CORE) ----------
export interface BookResult {
  blocked: boolean;
  conflictingBooking?: { id: string; start_time: string; end_time: string };
}

export async function bookResource(
  supabase: SupabaseClient,
  resourceAssetId: string,
  startTime: string,
  endTime: string,
  employeeId: string
): Promise<BookResult> {
  // Overlap condition: NOT (new.end <= existing.start OR new.start >= existing.end)
  // i.e. existing.start < new.end AND existing.end > new.start
  const { data: conflicts, error } = await supabase
    .from("bookings")
    .select("id, start_time, end_time")
    .eq("resource_asset_id", resourceAssetId)
    .neq("status", "Cancelled")
    .lt("start_time", endTime)
    .gt("end_time", startTime);

  if (error) return { blocked: true };

  if (conflicts && conflicts.length > 0) {
    return { blocked: true, conflictingBooking: conflicts[0] };
  }

  const { error: insertError } = await supabase.from("bookings").insert({
    resource_asset_id: resourceAssetId,
    booked_by_employee_id: employeeId,
    start_time: startTime,
    end_time: endTime,
  });
  if (insertError) return { blocked: true };

  return { blocked: false };
}

type BookingStatusRaw = "Upcoming" | "Ongoing" | "Completed" | "Cancelled";

export function computeBookingStatus(
  startTime: string,
  endTime: string,
  storedStatus: BookingStatusRaw
): BookingStatusRaw {
  if (storedStatus === "Cancelled") return "Cancelled";
  const now = Date.now();
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  if (now < start) return "Upcoming";
  if (now >= start && now < end) return "Ongoing";
  return "Completed";
}

// ---------- Maintenance approval -> auto status sync (CORE) ----------
export async function approveMaintenance(
  supabase: SupabaseClient,
  requestId: string,
  approverEmployeeId: string
) {
  const { data: req, error } = await supabase
    .from("maintenance_requests")
    .update({ status: "Approved", approved_by: approverEmployeeId })
    .eq("id", requestId)
    .select("asset_id")
    .single();
  if (error || !req) throw error ?? new Error("Maintenance request not found");

  await supabase.from("assets").update({ status: "Under Maintenance" }).eq("id", req.asset_id);
}

export async function rejectMaintenance(
  supabase: SupabaseClient,
  requestId: string,
  approverEmployeeId: string
) {
  await supabase
    .from("maintenance_requests")
    .update({ status: "Rejected", approved_by: approverEmployeeId })
    .eq("id", requestId);
}

export async function resolveMaintenance(supabase: SupabaseClient, requestId: string) {
  const { data: req, error } = await supabase
    .from("maintenance_requests")
    .update({ status: "Resolved", resolved_at: new Date().toISOString() })
    .eq("id", requestId)
    .select("asset_id")
    .single();
  if (error || !req) throw error ?? new Error("Maintenance request not found");

  await supabase.from("assets").update({ status: "Available" }).eq("id", req.asset_id);
}

// ---------- Role change guard ----------
// Call this from the Employee Directory action ONLY. Never expose a path
// that lets a user set their own role.
export async function changeEmployeeRole(
  supabase: SupabaseClient,
  actingEmployeeId: string,
  targetEmployeeId: string,
  newRole: "employee" | "department_head" | "asset_manager" | "admin"
) {
  const { data: actor } = await supabase
    .from("employees")
    .select("role")
    .eq("id", actingEmployeeId)
    .single();
  if (actor?.role !== "admin") {
    throw new Error("Only Admin can change roles.");
  }
  if (actingEmployeeId === targetEmployeeId) {
    throw new Error("Self-elevation is not allowed.");
  }
  return supabase.from("employees").update({ role: newRole }).eq("id", targetEmployeeId);
}
