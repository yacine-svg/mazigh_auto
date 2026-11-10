"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BadgeDollarSign,
  ChartNoAxesCombined,
  CircleAlert,
  Percent,
  TrendingUp,
  CarFront,
  Download,
  Warehouse,
  Receipt,
} from "lucide-react";
import { Kpi, Panel } from "@/app/components/admin/ui";
import { formatCompact } from "@/app/components/admin/metrics";
import type { CarFinance, FinanceCarSummary } from "@/app/data/car-finances";
import { formatPriceDZD } from "@/app/data/cars";

type FinanceDashboardClientProps = {
  cars: FinanceCarSummary[];
  finances: CarFinance[];
};

type FinanceRow = FinanceCarSummary & {
  finance: CarFinance | null;
  dateKey: string | null;
};

type MonthProfit = {
  month: string;
  profit: number;
  salesCount: number;
  knownCostCount: number;
};

const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

function currentAlgiersYear() {
  return Number(
    new Intl.DateTimeFormat("en", {
      timeZone: "Africa/Algiers",
      year: "numeric",
    }).format(new Date()),
  );
}

function dateKeyInAlgiers(value: string | null | undefined): string | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Algiers",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function formatCompactDzd(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function safeCsvCell(value: string | number | null) {
  const text = value == null ? "" : String(value);
  const safe =
    typeof value === "number" || !/^[=+\-@\t\r]/.test(text) ? text : `'${text}`;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function FinanceDashboardClient({
  cars,
  finances,
}: FinanceDashboardClientProps) {
  const [selectedYear, setSelectedYear] = useState(currentAlgiersYear);
  const [selectedMonth, setSelectedMonth] = useState("all");

  const rows = useMemo(() => {
    const financeByCar = new Map(finances.map((finance) => [finance.car_id, finance]));
    return cars
      .filter((car) => car.statut === "vendue")
      .map((car): FinanceRow => {
        const finance = financeByCar.get(car.id) ?? null;
        return {
          ...car,
          finance,
          dateKey: dateKeyInAlgiers(finance?.date_vente),
        };
      });
  }, [cars, finances]);

  const years = useMemo(() => {
    const availableYears = rows.flatMap((row) =>
      row.dateKey ? [Number(row.dateKey.slice(0, 4))] : [],
    );
    return Array.from(new Set([currentAlgiersYear(), ...availableYears])).sort(
      (a, b) => b - a,
    );
  }, [rows]);

  const yearRows = useMemo(
    () => rows.filter((row) => !row.dateKey || row.dateKey.startsWith(`${selectedYear}-`)),
    [rows, selectedYear],
  );

  const filteredRows = useMemo(
    () =>
      yearRows
        .filter(
          (row) =>
            !row.dateKey ||
            selectedMonth === "all" ||
            row.dateKey.slice(5, 7) === selectedMonth,
        )
        .sort((a, b) => (b.dateKey ?? "").localeCompare(a.dateKey ?? "")),
    [selectedMonth, yearRows],
  );

  const monthlyProfits = useMemo<MonthProfit[]>(
    () =>
      MONTHS.map((month, index) => {
        const monthNumber = String(index + 1).padStart(2, "0");
        const monthRows = yearRows.filter((row) => row.dateKey?.slice(5, 7) === monthNumber);
        const knownRows = monthRows.filter(
          (row) =>
            row.finance?.prix_achat != null &&
            row.finance.frais != null &&
            row.finance.prix_vente != null,
        );
        return {
          month: month.slice(0, 3),
          profit: knownRows.reduce(
            (total, row) =>
              total +
              (row.finance!.prix_vente! - row.finance!.prix_achat! - row.finance!.frais!),
            0,
          ),
          salesCount: monthRows.length,
          knownCostCount: knownRows.length,
        };
      }),
    [yearRows],
  );

  const totalRevenue = filteredRows.reduce(
    (total, row) => total + (row.finance?.prix_vente ?? 0),
    0,
  );
  const knownCostRows = filteredRows.filter(
    (row) =>
      row.finance?.prix_achat != null &&
      row.finance.frais != null &&
      row.finance.prix_vente != null,
  );
  const totalProfit = knownCostRows.reduce(
    (total, row) =>
      total + row.finance!.prix_vente! - row.finance!.prix_achat! - row.finance!.frais!,
    0,
  );
  const marginRows = knownCostRows.filter((row) => row.finance!.prix_vente! > 0);
  const averageMargin =
    marginRows.length === 0
      ? null
      : marginRows.reduce(
          (total, row) =>
            total +
            (row.finance!.prix_vente! > 0
              ? ((row.finance!.prix_vente! -
                  row.finance!.prix_achat! -
                  row.finance!.frais!) /
                  row.finance!.prix_vente!) *
                100
              : 0),
          0,
        ) / marginRows.length;
  const missingCostCount = filteredRows.filter(
    (row) => row.finance?.prix_achat == null || row.finance.frais == null,
  ).length;

  const stockRows = cars.filter(
    (car) => car.statut !== "vendue",
  );
  const stockFinanceByCar = new Map(finances.map((finance) => [finance.car_id, finance]));
  const stockValue = stockRows.reduce(
    (total, car) => total + (stockFinanceByCar.get(car.id)?.prix_achat ?? 0),
    0,
  );
  const stockMissingCostCount = stockRows.filter(
    (car) => stockFinanceByCar.get(car.id)?.prix_achat == null,
  ).length;

  const exportCsv = () => {
    const header = [
      "Date",
      "Voiture",
      "Achat (DA)",
      "Frais (DA)",
      "Vente (DA)",
      "Bénéfice (DA)",
      "Marge (%)",
    ];
    const csvRows = filteredRows.map((row) => {
      const finance = row.finance;
      const hasProfit =
        finance?.prix_achat != null &&
        finance.frais != null &&
        finance.prix_vente != null;
      const profit = hasProfit
        ? finance.prix_vente! - finance.prix_achat! - finance.frais!
        : null;
      const margin =
        profit !== null && finance?.prix_vente
          ? ((profit / finance.prix_vente) * 100).toFixed(2)
          : null;
      return [
        row.dateKey,
        `${row.marque} ${row.modele} ${row.version} (${row.annee})`.trim(),
        finance?.prix_achat ?? null,
        finance?.frais ?? null,
        finance?.prix_vente ?? null,
        profit,
        margin,
      ]
        .map(safeCsvCell)
        .join(",");
    });
    const blob = new Blob(["\uFEFF", [header.map(safeCsvCell).join(","), ...csvRows].join("\r\n")], {
      type: "text/csv;charset=utf-8",
    });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `finances-${selectedYear}-${selectedMonth === "all" ? "annee" : selectedMonth}.csv`;
    link.click();
    URL.revokeObjectURL(href);
  };

  if (rows.length === 0) {
    return (
      <div className="panel px-5 py-16 text-center">
        <ChartNoAxesCombined className="mx-auto h-10 w-10 text-fg-3" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-semibold">Aucune vente enregistrée</h2>
        <p className="mt-1 text-sm text-fg-3">
          Les ventes confirmées depuis la gestion des véhicules apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="panel flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="segmented" role="group" aria-label="Année">
            {years.slice(0, 4).map((year) => (
              <button key={year} type="button" aria-pressed={selectedYear === year} onClick={() => setSelectedYear(year)}>
                {year}
              </button>
            ))}
          </div>
          <label>
            <span className="sr-only">Mois</span>
            <select value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} className="field field-sm min-w-44">
              <option value="all">Toute l&apos;année</option>
              {MONTHS.map((month, index) => (
                <option key={month} value={String(index + 1).padStart(2, "0")}>
                  {month}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button type="button" onClick={exportCsv} className="btn btn-ghost btn-sm">
          <Download aria-hidden="true" /> Exporter en CSV
        </button>
      </div>

      <div className="kpis">
        <Kpi accent label="Voitures vendues" icon={<CarFront />} value={filteredRows.length} foot={<span>{selectedMonth === "all" ? `Année ${selectedYear}` : MONTHS[Number(selectedMonth) - 1]}</span>} />
        <Kpi label="Chiffre d'affaires" icon={<BadgeDollarSign />} value={formatCompact(totalRevenue)} unit="DA" foot={<span>{formatPriceDZD(totalRevenue)}</span>} />
        <Kpi
          label="Bénéfice total"
          icon={<TrendingUp />}
          value={<span className={totalProfit >= 0 ? "text-ok" : "text-bad"}>{formatCompact(totalProfit)}</span>}
          unit="DA"
          foot={<span>{knownCostRows.length} vente(s) au coût connu</span>}
        />
        <Kpi label="Marge moyenne" icon={<Percent />} value={averageMargin == null ? "—" : averageMargin.toFixed(1)} unit={averageMargin == null ? undefined : "%"} foot={<span>sur le prix de vente</span>} />
        <Kpi
          label="Stock au prix d'achat"
          icon={<Warehouse />}
          value={formatCompact(stockValue)}
          unit="DA"
          alert={stockMissingCostCount > 0}
          foot={<span>{stockMissingCostCount > 0 ? `Coût manquant pour ${stockMissingCostCount} véhicule(s)` : `${stockRows.length} véhicule(s) en stock`}</span>}
        />
      </div>

      <Panel title={`Bénéfice par mois · ${selectedYear}`} icon={<ChartNoAxesCombined />} sub="Calculé sur les ventes dont le prix d'achat et les frais sont connus">
        <div className="overflow-x-auto">
          <div className="h-[300px] min-w-[640px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyProfits} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--line)" strokeDasharray="3 4" vertical={false} />
                <XAxis dataKey="month" stroke="var(--fg-3)" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis stroke="var(--fg-3)" tickLine={false} axisLine={false} fontSize={11} width={48} tickFormatter={formatCompactDzd} />
                <Tooltip
                  cursor={{ fill: "var(--surface-2)" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const entry = payload[0].payload as MonthProfit;
                    return (
                      <div className="rounded-xl border border-line bg-surface p-3 text-xs shadow-lg">
                        <p className="font-semibold">{entry.month}</p>
                        <p className={entry.profit >= 0 ? "text-ok" : "text-bad"}>Bénéfice : {formatPriceDZD(entry.profit)}</p>
                        <p className="text-fg-2">{entry.salesCount} voiture(s) vendue(s)</p>
                        {entry.knownCostCount < entry.salesCount && (
                          <p className="text-fg-3">{entry.salesCount - entry.knownCostCount} coût(s) manquant(s)</p>
                        )}
                      </div>
                    );
                  }}
                />
                <Bar dataKey="profit" name="Bénéfice" radius={[6, 6, 0, 0]} maxBarSize={42}>
                  {monthlyProfits.map((entry) => (
                    <Cell key={entry.month} fill={entry.profit < 0 ? "var(--bad)" : "var(--brand)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Panel>

      {missingCostCount > 0 && (
        <p className="alert alert-warn">
          <CircleAlert aria-hidden="true" />
          {missingCostCount} vente(s) exclue(s) du calcul des bénéfices, car le prix d&apos;achat ou les frais sont manquants.
        </p>
      )}

      <Panel title="Voitures vendues" icon={<Receipt />} sub={`${filteredRows.length} vente(s) sur la période`} body={false}>
        {filteredRows.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-fg-3">Aucune vente enregistrée pour cette période.</p>
        ) : (
          <div className="table-wrap">
            <table className="table min-w-[860px]">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Voiture</th>
                  <th className="!text-right">Achat</th>
                  <th className="!text-right">Frais</th>
                  <th className="!text-right">Vente</th>
                  <th className="!text-right">Bénéfice</th>
                  <th className="!text-right">Marge</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const finance = row.finance;
                  const hasProfit = finance?.prix_achat != null && finance.frais != null && finance.prix_vente != null;
                  const profit = hasProfit ? finance.prix_vente! - finance.prix_achat! - finance.frais! : null;
                  const margin = profit !== null && finance?.prix_vente ? (profit / finance.prix_vente) * 100 : null;
                  return (
                    <tr key={row.id}>
                      <td className="mono whitespace-nowrap text-fg-2">
                        {row.dateKey
                          ? new Intl.DateTimeFormat("fr-DZ", { timeZone: "Africa/Algiers", dateStyle: "medium" }).format(
                              new Date(`${row.dateKey}T12:00:00+01:00`),
                            )
                          : "—"}
                      </td>
                      <td>
                        <div className="cell-main">{row.marque} {row.modele}</div>
                        <div className="cell-sub">{row.version} {row.annee}</div>
                      </td>
                      <td className="t-num">{finance?.prix_achat == null ? "—" : formatPriceDZD(finance.prix_achat)}</td>
                      <td className="t-num">{finance?.frais == null ? "—" : formatPriceDZD(finance.frais)}</td>
                      <td className="t-num">{finance?.prix_vente == null ? "—" : formatPriceDZD(finance.prix_vente)}</td>
                      <td className="t-num">
                        {profit == null ? (
                          <span className="pill no-dot status-badge-reservee">coût manquant</span>
                        ) : (
                          <span className={profit >= 0 ? "text-ok" : "text-bad"}>{formatPriceDZD(profit)}</span>
                        )}
                      </td>
                      <td className="t-num">{margin == null ? "—" : `${margin.toFixed(1)} %`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
