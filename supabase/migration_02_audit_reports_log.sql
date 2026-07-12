-- Migration 02 — Audit Cycles polish + Activity Log
-- Run this in the Supabase SQL editor AFTER schema.sql has already been run.
-- Safe to run once; re-running will error on the duplicate columns/table
-- (harmless — just means it already applied).

-- audit_cycles / audit_items already exist from schema.sql. This adds what
-- was missing for a real UI: a human-readable name, and support for scoping
-- an audit by location as well as by department.
alter table audit_cycles add column name text not null default 'Untitled Audit';
alter table audit_cycles add column scope_location text;
alter table audit_cycles add column lead_auditor_employee_id uuid references employees(id);

-- audit_items.verification_status is already nullable — a null value means
-- "not yet checked" (no separate 'Unchecked' enum value needed). Add a
-- timestamp so the checklist can show when each item was last verified.
alter table audit_items add column checked_at timestamptz;

-- NEW: Activity Log. Denormalized actor_name so log entries stay readable
-- even if the acting employee is later renamed, and so system-generated
-- entries (actor_employee_id null) can still show something in the UI.
create table activity_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  details text not null,
  actor_employee_id uuid references employees(id),
  actor_name text not null,
  created_at timestamptz default now()
);

create index activity_logs_created_at_idx on activity_logs (created_at desc);
