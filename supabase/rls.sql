-- Optional — enable only if there's time. Fallback: rely on the role checks
-- already written into lib/business-logic.ts and treat this file as skipped.

alter table employees enable row level security;
alter table allocations enable row level security;

create policy "only_admin_updates_role"
on employees for update
using ((select role from employees where auth_user_id = auth.uid()) = 'admin');

create policy "view_own_or_dept_allocations"
on allocations for select
using (
  employee_id = (select id from employees where auth_user_id = auth.uid())
  or department_id = (select department_id from employees where auth_user_id = auth.uid())
);
