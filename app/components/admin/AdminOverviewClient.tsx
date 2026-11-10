"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlarmClock,
  ArrowRight,
  BadgeDollarSign,
  CarFront,
  ChartNoAxesCombined,
  Clock3,
  FilePen,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { Car, CarStatus } from "@/app/data/cars";
import { STATUS_LABELS, formatKm, formatPriceDZD } from "@/app/data/cars";
import type { CarFinance } from "@/app/data/car-finances";
import { CarImage } from "@/app/components/CarImage";
import { Delta, Kpi, Panel } from "./ui";
import { MONTHS_SHORT, dateKeyInAlgiers, formatCompact, saleProfit, stockDays } from "./metrics";

type Props = {
  cars: Car[];
  finances: CarFinance[];
};

const STATUS_ORDER: CarStatus[] = ["brouillon", "disponible", "reservee", "vendue"];
const STATUS_COLOR: Record<CarStatus, string> = {
  brouillon: "var(--fg-3)",
  disponible: "var(--ok)",
  reservee: "var(--warn)",
  vendue: "var(--brand)",
};

type MonthPoint = { key: string; label: string; revenue: number; profit: number; sales: number };

export function AdminOverviewClient({ cars, finances }: Props) {
  const [range, setRange] = useState<6 | 12>(6);
  const financeByCar = useMemo(() => new Map(finances.map((f) => [f.car_id, f])), [finances]);

  const today = dateKeyInAlgiers(new Date()) ?? new Date().toISOString().slice(0, 10);
  const thisMonth = today.slice(0, 7);
  const prevMonth = (() => {
    const [y, m] = thisMonth.split("-").map(Number);
    const d = new Date(Date.UTC(y, m - 2, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  })();

  const sold = cars.filter((c) => c.statut === "vendue");
  const unsold = cars.filter((c) => c.statut === "disponible" || c.statut === "reservee");
  const drafts = cars.filter((c) => c.statut === "brouillon");

  const saleMonth = (car: Car) => dateKeyInAlgiers(financeByCar.get(car.id)?.date_vente)?.slice(0, 7) ?? null;
  const monthStats = (month: string) => {
    const list = sold.filter((c) => saleMonth(c) === month);
    const profits = list.map((c) => saleProfit(financeByCar.get(c.id))).filter((p): p is number => p !== null);
    return {
      count: list.length,
      revenue: list.reduce((t, c) => t + (financeByCar.get(c.id)?.prix_vente ?? 0), 0),
      profit: profits.reduce((t, p) => t + p, 0),
    };
  };
  const cur = monthStats(thisMonth);
  const prev = monthStats(prevMonth);

  const stockValue = unsold.reduce((t, c) => t + c.prix, 0);
  const stockCost = unsold.reduce((t, c) => t + (financeByCar.get(c.id)?.prix_achat ?? 0), 0);
  const ages = unsold.map((c) => stockDays(c)).filter((d): d is number => d !== null);
  const avgAge = ages.length ? Math.round(ages.reduce((t, d) => t + d, 0) / ages.length) : 0;

  const aging = unsold
    .map((car) => ({ car, days: stockDays(car) ?? 0 }))
    .filter((x) => x.days > 45)
    .sort((a, b) => b.days - a.days)
    .slice(0, 6);

  const recent = cars
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  const series = useMemo<MonthPoint[]>(() => {
    const [y, m] = thisMonth.split("-").map(Number);
    return Array.from({ length: range }, (_, i) => {
      const d = new Date(Date.UTC(y, m - 1 - (range - 1 - i), 1));
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      const list = sold.filter((c) => saleMonth(c) === key);
      const profit = list
        .map((c) => saleProfit(financeByCar.get(c.id)))
        .filter((p): p is number => p !== null)
        .reduce((t, p) => t + p, 0);
      return {
        key,
        label: MONTHS_SHORT[d.getUTCMonth()],
        revenue: list.reduce((t, c) => t + (financeByCar.get(c.id)?.prix_vente ?? 0), 0),
        profit,
        sales: list.length,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, thisMonth, cars, finances]);

  const statusData = STATUS_ORDER.map((s) => ({
    status: s,
    label: STATUS_LABELS[s].label,
    value: cars.filter((c) => c.statut === s).length,
  }));

  const brandData = Array.from(
    unsold.reduce((map, c) => map.set(c.marque, (map.get(c.marque) ?? 0) + 1), new Map<string, number>()),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const brandMax = brandData[0]?.[1] ?? 1;

  return (
    <>
      <div className="kpis">
        <Kpi
          accent
          label="En stock"
          icon={<CarFront />}
          value={unsold.length}
          unit="véhicules"
          href="/admin/voitures"
          foot={<span>Valeur affichée {formatCompact(stockValue)} DA</span>}
        />
        <Kpi
          label="Ventes ce mois"
          icon={<BadgeDollarSign />}
          value={cur.count}
          unit={cur.count > 1 ? "ventes" : "vente"}
          href="/admin/finances"
          foot={
            <>
              <span>CA {formatCompact(cur.revenue)} DA</span>
              <Delta cur={cur.count} prev={prev.count} />
            </>
          }
        />
        <Kpi
          label="Bénéfice ce mois"
          icon={<TrendingUp />}
          value={<span className={cur.profit < 0 ? "text-bad" : ""}>{formatCompact(cur.profit)}</span>}
          unit="DA"
          href="/admin/finances"
          foot={
            <>
              <span>Mois précédent {formatCompact(prev.profit)} DA</span>
              <Delta cur={cur.profit} prev={prev.profit} />
            </>
          }
        />
        <Kpi
          label="Durée moyenne en stock"
          icon={<Clock3 />}
          value={avgAge}
          unit="jours"
          alert={aging.some((a) => a.days > 60)}
          href="/admin/voitures?tri=anciennes_stock"
          foot={<span>{aging.filter((a) => a.days > 60).length} véhicule(s) au-delà de 60 j</span>}
        />
        <Kpi
          label="Stock au prix d'achat"
          icon={<ChartNoAxesCombined />}
          value={formatCompact(stockCost)}
          unit="DA"
          foot={<span>Marge potentielle {formatCompact(Math.max(0, stockValue - stockCost))} DA</span>}
        />
      </div>

      {/* Pipeline strip */}
      <section className="panel overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {statusData.map((s, i) => (
            <Link
              key={s.status}
              href={`/admin/voitures?statut=${s.status}`}
              className={`group grid gap-1 p-4 transition-colors hover:bg-surface-2 ${i > 0 ? "md:border-l md:border-line" : ""} ${i % 2 ? "border-l border-line md:border-l" : ""} ${i > 1 ? "border-t border-line md:border-t-0" : ""}`}
            >
              <span className="flex items-center justify-between text-[0.8rem] text-fg-3">
                {s.label}
                <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
              </span>
              <span className="mono text-2xl">{s.value}</span>
              <span className="mt-1 block h-1 overflow-hidden rounded-full bg-surface-3">
                <span
                  className="block h-full rounded-full"
                  style={{ width: `${cars.length ? (s.value / cars.length) * 100 : 0}%`, background: STATUS_COLOR[s.status] }}
                />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel
          title="Ventes & bénéfice"
          icon={<ChartNoAxesCombined />}
          sub="Chiffre d'affaires et bénéfice (coûts connus) par mois"
          action={
            <div className="segmented" role="group" aria-label="Période">
              <button type="button" aria-pressed={range === 6} onClick={() => setRange(6)}>
                6 mois
              </button>
              <button type="button" aria-pressed={range === 12} onClick={() => setRange(12)}>
                12 mois
              </button>
            </div>
          }
        >
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="mzRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="mzProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--ok)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--ok)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--line)" strokeDasharray="3 4" vertical={false} />
                <XAxis dataKey="label" stroke="var(--fg-3)" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis stroke="var(--fg-3)" tickLine={false} axisLine={false} fontSize={11} width={48} tickFormatter={formatCompact} />
                <Tooltip
                  cursor={{ stroke: "var(--line-2)" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload as MonthPoint;
                    return (
                      <div className="rounded-xl border border-line bg-surface p-3 text-xs shadow-lg">
                        <p className="font-semibold">{p.label}</p>
                        <p className="mt-1 text-fg-2">CA : {formatPriceDZD(p.revenue)}</p>
                        <p className={p.profit >= 0 ? "text-ok" : "text-bad"}>Bénéfice : {formatPriceDZD(p.profit)}</p>
                        <p className="text-fg-3">{p.sales} vente(s)</p>
                      </div>
                    );
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--brand)" strokeWidth={2} fill="url(#mzRevenue)" />
                <Area type="monotone" dataKey="profit" stroke="var(--ok)" strokeWidth={2} fill="url(#mzProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-fg-3">
            <span className="inline-flex items-center gap-2">
              <i className="h-[3px] w-3.5 rounded-full bg-brand" /> Chiffre d&apos;affaires
            </span>
            <span className="inline-flex items-center gap-2">
              <i className="h-[3px] w-3.5 rounded-full bg-ok" /> Bénéfice
            </span>
          </div>
        </Panel>

        <Panel title="Répartition du parc" icon={<CarFront />} sub={`${cars.length} véhicule(s) au total`}>
          <div className="grid items-center gap-4 sm:grid-cols-[150px_minmax(0,1fr)] xl:grid-cols-1 2xl:grid-cols-[150px_minmax(0,1fr)]">
            <div className="relative mx-auto h-[150px] w-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData.filter((s) => s.value > 0)}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {statusData
                      .filter((s) => s.value > 0)
                      .map((s) => (
                        <Cell key={s.status} fill={STATUS_COLOR[s.status]} />
                      ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                <span>
                  <span className="mono block text-xl">{cars.length}</span>
                  <span className="text-[0.65rem] text-fg-3">véhicules</span>
                </span>
              </div>
            </div>
            <ul className="grid gap-2 text-sm">
              {statusData.map((s) => (
                <li key={s.status} className="grid grid-cols-[10px_minmax(0,1fr)_auto] items-center gap-2.5">
                  <i className="h-2.5 w-2.5 rounded-[3px]" style={{ background: STATUS_COLOR[s.status] }} />
                  <span className="text-fg-2">{s.label}</span>
                  <b className="mono font-medium">{s.value}</b>
                </li>
              ))}
            </ul>
          </div>

          {brandData.length > 0 && (
            <div className="mt-6 border-t border-line pt-5">
              <p className="mb-3 text-xs font-semibold text-fg-3">Marques en stock</p>
              <ul className="grid gap-3">
                {brandData.map(([brand, n]) => (
                  <li key={brand}>
                    <div className="mb-1 flex justify-between text-[0.82rem]">
                      <span>{brand}</span>
                      <span className="mono text-fg-3">{n}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${(n / brandMax) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="À surveiller"
          icon={<AlarmClock />}
          sub="Véhicules en stock depuis plus de 45 jours"
          body={false}
          action={
            <Link href="/admin/voitures?tri=anciennes_stock" className="btn btn-ghost btn-sm">
              Tout voir
            </Link>
          }
        >
          {aging.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-fg-3">Rien à signaler : le stock tourne bien.</p>
          ) : (
            <ul className="divide-y divide-line">
              {aging.map(({ car, days }) => (
                <CarRow key={car.id} car={car} side={
                  <span className={`pill no-dot ${days > 60 ? "status-badge-reservee" : "status-badge-brouillon"}`}>{days} j</span>
                } />
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Derniers ajouts"
          icon={<Sparkles />}
          sub={drafts.length ? `${drafts.length} brouillon(s) non publié(s)` : "Les 6 derniers véhicules enregistrés"}
          body={false}
          action={
            <Link href="/admin/voitures" className="btn btn-ghost btn-sm">
              Inventaire
            </Link>
          }
        >
          {recent.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <FilePen className="mx-auto h-8 w-8 text-fg-3" aria-hidden="true" />
              <p className="mt-3 text-sm text-fg-3">Aucun véhicule pour le moment.</p>
              <Link href="/admin/voitures/nouveau" className="btn btn-primary btn-sm mt-4">
                Ajouter le premier véhicule
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((car) => {
                const badge = STATUS_LABELS[car.statut];
                return <CarRow key={car.id} car={car} side={<span className={`pill ${badge.className}`}>{badge.label}</span>} />;
              })}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

function CarRow({ car, side }: { car: Car; side: ReactNode }) {
  return (
    <li>
      <Link
        href={`/admin/voitures/${car.id}/modifier`}
        className="flex items-center gap-3.5 px-4 py-3 transition-colors hover:bg-surface-2"
      >
        <span className="thumb">
          <CarImage src={car.cover_image_url || car.images[0]?.url} alt="" fill sizes="74px" className="object-cover" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="cell-main block truncate">
            {car.marque} {car.modele}
          </span>
          <span className="cell-sub block truncate">
            {car.annee} · {formatKm(car.kilometrage)} · {formatPriceDZD(car.prix)}
          </span>
        </span>
        {side}
      </Link>
    </li>
  );
}
