// Admin-only landing page for Organization Setup — links to the three tabs.
// Each tab is its own file/route so each teammate can build and push theirs
// independently: departments (Dhruv), categories (Nishtha), employees (Aayushi).
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export default async function OrgSetupPage() {
  const supabase = createClient();
  await requireRole(supabase, ["admin"]);

  const tabs = [
    { href: "/org-setup/departments", label: "Departments" },
    { href: "/org-setup/categories", label: "Categories" },
    { href: "/org-setup/employees", label: "Employee Directory" },
  ];
  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-4">Organization Setup</h1>
      <div className="flex gap-2 border-b border-border mb-4">
        {tabs.map((t) => (
          <a
            key={t.href}
            href={t.href}
            className="px-3 py-2 text-sm text-ink-soft hover:text-teal hover:border-b-2 hover:border-teal"
          >
            {t.label}
          </a>
        ))}
      </div>
      <p className="text-ink-soft">Pick a tab above.</p>
    </div>
  );
}
