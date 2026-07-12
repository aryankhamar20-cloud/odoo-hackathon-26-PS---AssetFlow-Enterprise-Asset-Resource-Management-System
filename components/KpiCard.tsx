export function KpiCard({
  label,
  value,
  warning,
}: {
  label: string;
  value: number | string;
  warning?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        warning ? "border-status-lost bg-red-50" : "border-border bg-paper-raised"
      }`}
    >
      <div className="text-sm text-ink-soft">{label}</div>
      <div className="font-display text-3xl font-bold">{value}</div>
    </div>
  );
}
