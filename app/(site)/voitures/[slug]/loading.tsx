export default function VehicleLoading() {
  return (
    <div className="wrap pb-20 pt-32" aria-busy="true" aria-live="polite">
      <div className="skeleton h-3 w-56" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          <div className="skeleton h-[clamp(16rem,48vw,40rem)] !rounded-[20px]" />
          <div className="flex gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-[4.4rem] w-[6.5rem]" />
            ))}
          </div>
        </div>
        <div className="space-y-4 rounded-[22px] border border-line bg-surface p-6">
          <div className="skeleton h-6 w-24 !rounded-full" />
          <div className="skeleton h-12 w-3/4" />
          <div className="skeleton h-14 w-1/2" />
          <div className="skeleton h-32 w-full" />
          <div className="skeleton h-12 w-full !rounded-full" />
        </div>
      </div>
      <span className="sr-only">Chargement du véhicule…</span>
    </div>
  );
}
