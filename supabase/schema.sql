-- AssetFlow schema — matches TRD exactly
-- (Fixed one ordering bug vs the original TRD: departments.head_employee_id
-- can't reference employees before employees exists, so that FK is added
-- via ALTER TABLE after the employees table is created below.)

-- ORG STRUCTURE
create table departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  head_employee_id uuid,
  parent_department_id uuid references departments(id),
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  custom_fields jsonb default '{}',
  created_at timestamptz default now()
);

create table employees (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id),
  name text not null,
  email text unique not null,
  department_id uuid references departments(id),
  role text not null default 'employee'
    check (role in ('employee','department_head','asset_manager','admin')),
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz default now()
);

alter table departments
  add constraint departments_head_fk foreign key (head_employee_id) references employees(id);

-- ASSETS
create table assets (
  id uuid primary key default gen_random_uuid(),
  asset_tag text unique not null,
  name text not null,
  category_id uuid references categories(id),
  serial_number text,
  acquisition_date date,
  acquisition_cost numeric(12,2),
  condition text check (condition in ('New','Good','Fair','Poor','Damaged')),
  location text,
  photo_url text,
  is_bookable boolean default false,
  status text not null default 'Available'
    check (status in ('Available','Allocated','Reserved','Under Maintenance','Lost','Retired','Disposed')),
  current_holder_employee_id uuid references employees(id),
  current_holder_department_id uuid references departments(id),
  created_at timestamptz default now()
);

create sequence asset_tag_seq start 1;

-- Helper RPC so lib/business-logic.ts can call supabase.rpc('nextval_asset_tag_seq')
create function nextval_asset_tag_seq() returns bigint as
$$ select nextval('asset_tag_seq') $$ language sql;

-- ALLOCATION & TRANSFER
create table allocations (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references assets(id) not null,
  employee_id uuid references employees(id),
  department_id uuid references departments(id),
  expected_return_date date,
  returned_at timestamptz,
  condition_checkin_note text,
  created_at timestamptz default now()
);

create table transfer_requests (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references assets(id) not null,
  from_employee_id uuid references employees(id),
  to_employee_id uuid references employees(id) not null,
  status text not null default 'Requested'
    check (status in ('Requested','Approved','Rejected','Re-allocated')),
  requested_by uuid references employees(id),
  approved_by uuid references employees(id),
  created_at timestamptz default now()
);

-- RESOURCE BOOKING
create table bookings (
  id uuid primary key default gen_random_uuid(),
  resource_asset_id uuid references assets(id) not null,
  booked_by_employee_id uuid references employees(id) not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'Upcoming'
    check (status in ('Upcoming','Ongoing','Completed','Cancelled')),
  created_at timestamptz default now(),
  constraint valid_range check (end_time > start_time)
);

-- MAINTENANCE
create table maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references assets(id) not null,
  raised_by_employee_id uuid references employees(id) not null,
  issue_description text not null,
  priority text check (priority in ('Low','Medium','High')),
  photo_url text,
  status text not null default 'Pending'
    check (status in ('Pending','Approved','Rejected','Technician Assigned','In Progress','Resolved')),
  approved_by uuid references employees(id),
  technician_name text,
  created_at timestamptz default now(),
  resolved_at timestamptz
);

-- AUDIT (stretch, P2 — cut first if behind)
create table audit_cycles (
  id uuid primary key default gen_random_uuid(),
  scope_department_id uuid references departments(id),
  date_range_start date,
  date_range_end date,
  status text default 'Open' check (status in ('Open','Closed')),
  created_at timestamptz default now()
);

create table audit_items (
  id uuid primary key default gen_random_uuid(),
  audit_cycle_id uuid references audit_cycles(id) not null,
  asset_id uuid references assets(id) not null,
  auditor_employee_id uuid references employees(id),
  verification_status text check (verification_status in ('Verified','Missing','Damaged')),
  notes text
);

-- Overdue-returns view, used by the dashboard KPI card
create view overdue_allocations as
select a.*, e.name as employee_name
from allocations a
join employees e on e.id = a.employee_id
where a.returned_at is null
  and a.expected_return_date < current_date;

-- Seed: one Admin so the very first login can promote everyone else.
-- Run this AFTER you've signed up once through the app (so auth.users has
-- a row), then update the email below and run just this statement:
-- update employees set role = 'admin' where email = 'you@example.com';
