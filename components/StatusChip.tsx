const STATUS_COLORS: Record<string, string> = {
  Available: "#2E8B57",
  Allocated: "#3163C4",
  Reserved: "#C98A2E",
  "Under Maintenance": "#D4712B",
  Lost: "#C4443A",
  Retired: "#8A8F98",
  Disposed: "#4A4E57",
};

export function StatusChip({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? "#8A8F98";
  const outlined = status === "Retired" || status === "Disposed";
  const strike = status === "Disposed";
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
      style={{
        borderLeft: `3px dashed ${color}`,
        color: outlined ? color : "white",
        backgroundColor: outlined ? "transparent" : color,
        border: outlined ? `1px solid ${color}` : undefined,
        borderLeftWidth: 3,
        borderLeftStyle: "dashed",
        textDecoration: strike ? "line-through" : undefined,
      }}
    >
      {status}
    </span>
  );
}
