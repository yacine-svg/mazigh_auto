export default function AdminDashboardLoading() {
  return (
    <div className="grid gap-5" aria-busy="true">
      <div className="space-y-3">
        <div className="skeleton h-3 w-40" />
        <div className="skeleton h-9 w-72" />
      </div>
      <div className="kpis">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="kpi">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton h-7 w-32" />
            <div className="skeleton h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="panel">
        <div className="panel-head">
          <div className="skeleton h-4 w-40" />
        </div>
        <div className="divide-y divide-line">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <div className="skeleton h-12 w-16 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-40" />
                <div className="skeleton h-3 w-24" />
              </div>
              <div className="skeleton hidden h-6 w-24 !rounded-full sm:block" />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Chargement…</span>
    </div>
  );
}
