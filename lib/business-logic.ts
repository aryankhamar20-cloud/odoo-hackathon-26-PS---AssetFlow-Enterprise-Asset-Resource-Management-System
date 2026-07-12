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

// PRD 5.5: allocation target is EITHER an employee OR a department, never
// neither and never both. Pass exactly one of the two.
export interface AllocateTarget {
  employeeId?: string;
  departmentId?: string;
}

export async function allocateAsset(
  supabase: SupabaseClient,
  assetId: string,
  target: AllocateTarget,
  expectedReturn?: string
): Promise<AllocateResult> {
  if (!target.employeeId && !target.departmentId) {
    return { blocked: true, message: "Choose an employee or a department to allocate to." };
  }

  const { data: asset, error } = await supabase
    .from("assets")
    .select("status, current_holder_employee_id, current_holder_department_id")
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
    } else if (asset.current_holder_department_id) {
      const { data: dept } = await supabase
        .from("departments")
        .select("name")
        .eq("id", asset.current_holder_department_id)
        .single();
      if (dept?.name) holderName = `the ${dept.name} department`;
    }
    return {
      blocked: true,
      message: `Currently held by ${holderName}`,
      offerTransferRequest: true,
    };
  }

  const { error: insertError } = await supabase.from("allocations").insert({
    asset_id: assetId,
    employee_id: target.employeeId ?? null,
    department_id: target.departmentId ?? null,
    expected_return_date: expectedReturn ?? null,
  });
  if (insertError) return { blocked: true, message: insertError.message };

  await supabase
    .from("assets")
    .update({
      status: "Allocated",
      current_holder_employee_id: target.employeeId ?? null,
      current_holder_department_id: target.departmentId ?? null,
    })
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
  conflictingBooking?: { id: string; start_time: string; end_time: string; bookedByName?: string };
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
    .select("id, start_time, end_time, booked_by_employee_id")
    .eq("resource_asset_id", resourceAssetId)
    .neq("status", "Cancelled")
    .lt("start_time", endTime)
    .gt("end_time", startTime);

  if (error) return { blocked: true };

  if (conflicts && conflicts.length > 0) {
    const conflict = conflicts[0] as any;
    let bookedByName: string | undefined;
    if (conflict.booked_by_employee_id) {
      const { data: booker } = await supabase
        .from("employees")
        .select("name")
        .eq("id", conflict.booked_by_employee_id)
        .single();
      bookedByName = booker?.name;
    }
    return {
      blocked: true,
      conflictingBooking: {
        id: conflict.id,
        start_time: conflict.start_time,
        end_time: conflict.end_time,
        bookedByName,
      },
    };
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

export async function cancelBooking(supabase: SupabaseClient, bookingId: string) {
  return supabase.from("bookings").update({ status: "Cancelled" }).eq("id", bookingId);
}

// PRD 5.6: "Cancel/reschedule allowed while Upcoming." Reschedule re-runs
// the same overlap rule against the NEW time range, excluding this booking
// itself from the conflict check.
export async function rescheduleBooking(
  supabase: SupabaseClient,
  bookingId: string,
  newStart: string,
  newEnd: string
): Promise<BookResult> {
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("id, resource_asset_id, status")
    .eq("id", bookingId)
    .single();

  if (error || !booking) return { blocked: true };
  if (booking.status !== "Upcoming") {
    return { blocked: true };
  }

  const { data: conflicts, error: conflictError } = await supabase
    .from("bookings")
    .select("id, start_time, end_time, booked_by_employee_id")
    .eq("resource_asset_id", booking.resource_asset_id)
    .neq("status", "Cancelled")
    .neq("id", bookingId)
    .lt("start_time", newEnd)
    .gt("end_time", newStart);

  if (conflictError) return { blocked: true };

  if (conflicts && conflicts.length > 0) {
    const conflict = conflicts[0] as any;
    let bookedByName: string | undefined;
    if (conflict.booked_by_employee_id) {
      const { data: booker } = await supabase
        .from("employees")
        .select("name")
        .eq("id", conflict.booked_by_employee_id)
        .single();
      bookedByName = booker?.name;
    }
    return {
      blocked: true,
      conflictingBooking: {
        id: conflict.id,
        start_time: conflict.start_time,
        end_time: conflict.end_time,
        bookedByName,
      },
    };
  }

  const { error: updateError } = await supabase
    .from("bookings")
    .update({ start_time: newStart, end_time: newEnd })
    .eq("id", bookingId);
  if (updateError) return { blocked: true };

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

export async function assignTechnician(
  supabase: SupabaseClient,
  requestId: string,
  technicianName: string
) {
  await supabase
    .from("maintenance_requests")
    .update({ status: "Technician Assigned", technician_name: technicianName })
    .eq("id", requestId);
}

export async function startMaintenanceProgress(supabase: SupabaseClient, requestId: string) {
  await supabase
    .from("maintenance_requests")
    .update({ status: "In Progress" })
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

// ---------- Terminal status changes (Lost / Retired / Disposed) ----------
// These statuses exist in the schema and StatusChip already renders them,
// but nothing in the allocate/book/maintenance flows ever sets them — this
// is the only path to reach them, deliberately separate from those flows.
export type TerminalAssetStatus = "Lost" | "Retired" | "Disposed";

export async function setAssetStatus(
  supabase: SupabaseClient,
  assetId: string,
  newStatus: TerminalAssetStatus
) {
  // Clearing the holder fields too: an asset marked Lost/Retired/Disposed
  // shouldn't still show as "held by" someone in the directory/history views.
  return supabase
    .from("assets")
    .update({
      status: newStatus,
      current_holder_employee_id: null,
      current_holder_department_id: null,
    })
    .eq("id", assetId);
}

// ---------- Transfer rejection ----------
export async function rejectTransfer(
  supabase: SupabaseClient,
  transferRequestId: string,
  approverEmployeeId: string
) {
  return supabase
    .from("transfer_requests")
    .update({ status: "Rejected", approved_by: approverEmployeeId })
    .eq("id", transferRequestId);
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

// ---------- Activity log ----------
// Fire-and-forget-ish: called after every successful mutation across the
// app. actorEmployeeId is null only for genuinely system-generated entries;
// every user-triggered call site has a real employee from getCurrentEmployee.
export async function logActivity(
  supabase: SupabaseClient,
  action: string,
  details: string,
  actorEmployeeId: string | null,
  actorName: string
) {
  return supabase.from("activity_logs").insert({
    action,
    details,
    actor_employee_id: actorEmployeeId,
    actor_name: actorName,
  });
}

// ---------- Audit cycles ----------
// Requires migration_02_audit_reports_log.sql to have been run (adds
// audit_cycles.name / scope_location / lead_auditor_employee_id and
// audit_items.checked_at — the base audit_cycles/audit_items tables
// themselves already existed in schema.sql from the original scaffold).
export interface AuditScope {
  departmentId?: string;
  location?: string;
}

export async function createAuditCycle(
  supabase: SupabaseClient,
  name: string,
  scope: AuditScope,
  dateRangeStart: string | null,
  dateRangeEnd: string | null,
  leadAuditorEmployeeId: string | null
): Promise<string> {
  if (!scope.departmentId && !scope.location) {
    throw new Error("Choose a department or a location to scope this audit.");
  }

  // Resolve which assets fall in scope. Department scope = assets currently
  // held by that department directly, OR held by an employee who belongs
  // to it. Location scope = assets whose location field matches exactly.
  let assetIds: string[] = [];
  if (scope.departmentId) {
    const { data: deptEmployees } = await supabase
      .from("employees")
      .select("id")
      .eq("department_id", scope.departmentId);
    const employeeIds = (deptEmployees ?? []).map((e: any) => e.id as string);

    const orParts = [`current_holder_department_id.eq.${scope.departmentId}`];
    if (employeeIds.length > 0) {
      orParts.push(`current_holder_employee_id.in.(${employeeIds.join(",")})`);
    }
    const { data: assets } = await supabase.from("assets").select("id").or(orParts.join(","));
    assetIds = (assets ?? []).map((a: any) => a.id as string);
  } else if (scope.location) {
    const { data: assets } = await supabase.from("assets").select("id").eq("location", scope.location);
    assetIds = (assets ?? []).map((a: any) => a.id as string);
  }

  const { data: cycle, error } = await supabase
    .from("audit_cycles")
    .insert({
      name,
      scope_department_id: scope.departmentId ?? null,
      scope_location: scope.location ?? null,
      date_range_start: dateRangeStart,
      date_range_end: dateRangeEnd,
      lead_auditor_employee_id: leadAuditorEmployeeId,
      status: "Open",
    })
    .select("id")
    .single();
  if (error || !cycle) throw error ?? new Error("Could not create audit cycle.");

  if (assetIds.length > 0) {
    const items = assetIds.map((assetId) => ({ audit_cycle_id: cycle.id, asset_id: assetId }));
    const { error: itemsError } = await supabase.from("audit_items").insert(items);
    if (itemsError) throw itemsError;
  }

  return cycle.id as string;
}

export async function checkAuditItem(
  supabase: SupabaseClient,
  auditItemId: string,
  verificationStatus: "Verified" | "Missing" | "Damaged",
  checkedByEmployeeId: string,
  notes?: string
) {
  return supabase
    .from("audit_items")
    .update({
      verification_status: verificationStatus,
      auditor_employee_id: checkedByEmployeeId,
      notes: notes ?? null,
      checked_at: new Date().toISOString(),
    })
    .eq("id", auditItemId);
}

// Closing an open audit auto-flips any item still marked "Missing" to the
// asset's terminal Lost status — same mechanism as AssetStatusControl,
// reused rather than duplicated.
export async function closeAuditCycle(
  supabase: SupabaseClient,
  auditCycleId: string
): Promise<{ missingCount: number }> {
  const { data: items } = await supabase
    .from("audit_items")
    .select("asset_id, verification_status")
    .eq("audit_cycle_id", auditCycleId);

  const missingAssetIds = (items ?? [])
    .filter((i: any) => i.verification_status === "Missing")
    .map((i: any) => i.asset_id as string);

  for (const assetId of missingAssetIds) {
    await setAssetStatus(supabase, assetId, "Lost");
  }

  await supabase.from("audit_cycles").update({ status: "Closed" }).eq("id", auditCycleId);

  return { missingCount: missingAssetIds.length };
}
