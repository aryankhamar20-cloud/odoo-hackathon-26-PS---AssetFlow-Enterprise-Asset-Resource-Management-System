// TODO: detail view — asset fields, allocation history, maintenance history,
// Allocate button (wire to allocateAsset(), show ConflictModal on block).
export default function AssetDetailPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-4">Asset {params.id}</h1>
      <p className="text-ink-soft">TODO: detail view — see PRD 5.4/5.5.</p>
    </div>
  );
}
