import type { Metadata } from "next";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "@/lib/auth";
import { SignOutButton } from "@/components/SignOutButton";
import { RoleBadge } from "@/components/RoleBadge";

export const metadata: Metadata = {
  title: "AssetFlow",
  description: "Enterprise Asset & Resource Management",
};

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/org-setup", label: "Organization Setup", adminOnly: true },
  { href: "/assets", label: "Assets" },
  { href: "/allocations", label: "Allocations & Transfers" },
  { href: "/bookings", label: "Resource Booking" },
  { href: "/maintenance", label: "Maintenance" },
  { href: "/audits", label: "Audit Cycles", managerOnly: true },
  { href: "/reports", label: "Reports", managerOnly: true },
  { href: "/activity-log", label: "Activity Log", managerOnly: true },
];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const currentEmployee = await getCurrentEmployee(supabase);
  const isManager =
    currentEmployee?.role === "asset_manager" || currentEmployee?.role === "admin";

  return (
    <html lang="en">
      <body className="min-h-screen bg-paper text-ink">
        <div className="flex min-h-screen">
          <aside className="flex w-60 shrink-0 flex-col justify-between bg-ink text-white">
            <div>
              <div className="p-4 font-display text-xl font-bold">AssetFlow</div>
              {currentEmployee && (
                <nav className="flex flex-col gap-1 px-2">
                  {NAV_ITEMS.filter(
                    (item) =>
                      (!item.adminOnly || currentEmployee.role === "admin") &&
                      (!item.managerOnly || isManager)
                  ).map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      className="rounded px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>
              )}
            </div>
            {currentEmployee && (
              <div className="space-y-2 p-3">
                <div className="px-1 text-sm font-medium">{currentEmployee.name}</div>
                <RoleBadge role={currentEmployee.role} />
                <SignOutButton />
              </div>
            )}
          </aside>
          <main className="flex-1 mx-auto w-full max-w-[1280px] p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
