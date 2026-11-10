export default function VoituresLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <section className="border-b border-line pb-12 pt-36 md:pb-16 md:pt-44">
        <div className="wrap space-y-5">
          <div className="skeleton h-3 w-48" />
          <div className="skeleton h-24 w-full max-w-2xl md:h-32" />
        </div>
      </section>
      <section className="wrap space-y-6 py-10 md:py-14">
        <div className="skeleton h-[3.25rem] w-full !rounded-full" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-[18px] border border-line bg-surface">
              <div className="skeleton aspect-[16/10.5] !rounded-none" />
              <div className="space-y-3 p-6">
                <div className="skeleton h-3 w-24" />
                <div className="skeleton h-7 w-3/4" />
                <div className="skeleton h-12 w-full" />
              </div>
            </div>
          ))}
        </div>
      </section>
      <span className="sr-only">Chargement des véhicules…</span>
    </div>
  );
}
