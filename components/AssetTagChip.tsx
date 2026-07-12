export function AssetTagChip({ tag }: { tag: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full bg-teal-soft px-3 py-1 font-mono-data text-xs text-teal"
      style={{ borderLeft: "3px dashed #0E7C86" }}
    >
      {tag}
    </span>
  );
}
