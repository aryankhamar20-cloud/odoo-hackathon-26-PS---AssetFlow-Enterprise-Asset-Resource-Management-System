// Signature "tick-mark" chip shape, reused for role badges per the design doc.
const ROLE_LABELS: Record<string, string> = {
  employee: "Employee",
  department_head: "Dept. Head",
  asset_manager: "Asset Manager",
  admin: "Admin",
};

export function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs text-white"
      style={{ borderLeft: "3px dashed #0E7C86" }}
    >
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}
