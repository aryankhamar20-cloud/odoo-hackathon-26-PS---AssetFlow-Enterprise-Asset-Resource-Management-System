export type Role = "employee" | "department_head" | "asset_manager" | "admin";

export type AssetStatus =
  | "Available"
  | "Allocated"
  | "Reserved"
  | "Under Maintenance"
  | "Lost"
  | "Retired"
  | "Disposed";

export type BookingStatus = "Upcoming" | "Ongoing" | "Completed" | "Cancelled";

export type MaintenanceStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Technician Assigned"
  | "In Progress"
  | "Resolved";

export type TransferStatus = "Requested" | "Approved" | "Rejected" | "Re-allocated";

export interface Employee {
  id: string;
  name: string;
  email: string;
  department_id: string | null;
  role: Role;
  status: "active" | "inactive";
}

export interface Asset {
  id: string;
  asset_tag: string;
  name: string;
  category_id: string | null;
  status: AssetStatus;
  is_bookable: boolean;
  current_holder_employee_id: string | null;
  current_holder_department_id: string | null;
}
