"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CarImage } from "@/app/components/CarImage";
import type { Car, CarFuel, CarStatus, CarTransmission } from "@/app/data/cars";
import {
  formatPriceDZD,
  formatKm,
  STATUS_LABELS,
} from "@/app/data/cars";
import type { CarFinance, CarSaleDetails } from "@/app/data/car-finances";
import { deleteCarAction, toggleCarFeaturedAction, updateCarStatusAction } from "./car-actions";
import { ChevronDown, Eye, Filter, Pencil, RotateCcw, Search, Star, Trash2, TriangleAlert, X } from "lucide-react";
import { SaleConfirmationDialog } from "./SaleConfirmationDialog";
import { SaleReversalDialog } from "./SaleReversalDialog";

type AdminCarsTableClientProps = {
  initialCars: Car[];
  initialFinances: CarFinance[];
};

type CarFilters = {
  q: string;
  marque: string;
  carburant: string;
  boite: string;
  carrosserie: string;
  statut: string;
  vedette: string;
  prixMin: string;
  prixMax: string;
  anneeMin: string;
  anneeMax: string;
  tri: string;
};

const DEFAULT_FILTERS: CarFilters = {
  q: "",
  marque: "",
  carburant: "",
  boite: "",
  carrosserie: "",
  statut: "",
  vedette: "",
  prixMin: "",
  prixMax: "",
  anneeMin: "",
  anneeMax: "",
  tri: "recentes",
};

const FILTER_PARAMS = Object.keys(DEFAULT_FILTERS) as (keyof CarFilters)[];
const SORT_OPTIONS = [
  ["recentes", "Plus récentes"],
  ["prix_asc", "Prix croissant"],
  ["prix_desc", "Prix décroissant"],
  ["annee_desc", "Année"],
  ["anciennes_stock", "Plus anciennes en stock"],
] as const;

function readFilters(params: URLSearchParams): CarFilters {
  const filters = { ...DEFAULT_FILTERS };
  for (const key of FILTER_PARAMS) {
    const value = params.get(key);
    if (value !== null) filters[key] = value;
  }
  if (!SORT_OPTIONS.some(([value]) => value === filters.tri)) {
    filters.tri = DEFAULT_FILTERS.tri;
  }
  return filters;
}

function dateInAlgiers(date: Date) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Africa/Algiers",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: string) => parts.find((value) => value.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function getStockDays(car: Car, finance?: CarFinance) {
  const startedAt = dateInAlgiers(new Date(car.created_at));
  const endedAt =
    car.statut === "vendue" && finance?.date_vente
      ? finance.date_vente.slice(0, 10)
      : dateInAlgiers(new Date());
  const start = Date.parse(`${startedAt}T00:00:00Z`);
  const end = Date.parse(`${endedAt}T00:00:00Z`);
  if (!Number.isFinite(start)) return null;
  return Math.max(0, Math.floor((end - start) / 86_400_000));
}

export function AdminCarsTableClient({
  initialCars,
  initialFinances,
}: AdminCarsTableClientProps) {
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const filters = useMemo(
    () => readFilters(new URLSearchParams(searchParamsKey)),
    [searchParamsKey],
  );
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [cars, setCars] = useState<Car[]>(initialCars);
  const [prevInitialCars, setPrevInitialCars] = useState<Car[]>(initialCars);
  const [finances, setFinances] = useState<CarFinance[]>(initialFinances);
  const [prevInitialFinances, setPrevInitialFinances] =
    useState<CarFinance[]>(initialFinances);
  const [confirmSaleCar, setConfirmSaleCar] = useState<Car | null>(null);
  const [confirmSaleReversalCar, setConfirmSaleReversalCar] = useState<Car | null>(null);

  if (initialCars !== prevInitialCars) {
    setPrevInitialCars(initialCars);
    setCars(initialCars);
  }
  if (initialFinances !== prevInitialFinances) {
    setPrevInitialFinances(initialFinances);
    setFinances(initialFinances);
  }

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteCar, setConfirmDeleteCar] = useState<Car | null>(null);
  const [actionError, setActionError] = useState("");
  const [isPending, startTransition] = useTransition();

  const updateFilters = (
    patch: Partial<CarFilters>,
    history: "push" | "replace" = "push",
  ) => {
    const next = { ...filters, ...patch };
    const params = new URLSearchParams(searchParamsKey);
    for (const key of FILTER_PARAMS) {
      const value = next[key].trim();
      if (!value || (key === "tri" && value === DEFAULT_FILTERS.tri)) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    const url = new URL(window.location.href);
    url.search = params.toString();
    window.history[history === "push" ? "pushState" : "replaceState"](
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  };

  const resetFilters = () => updateFilters(DEFAULT_FILTERS, "push");

  // Stats calculation
  const totalCars = cars.length;
  const availableCount = cars.filter((c) => c.statut === "disponible").length;
  const reservedCount = cars.filter((c) => c.statut === "reservee").length;
  const soldCount = cars.filter((c) => c.statut === "vendue").length;

  const brands = useMemo(
    () => Array.from(new Set(cars.map((car) => car.marque).filter(Boolean))).sort(),
    [cars],
  );
  const carburants = useMemo(
    () => Array.from(new Set(cars.map((car) => car.carburant).filter(Boolean))).sort(),
    [cars],
  );
  const transmissions = useMemo(
    () => Array.from(new Set(cars.map((car) => car.boite).filter(Boolean))).sort(),
    [cars],
  );
  const carrosseries = useMemo(
    () => Array.from(new Set(cars.map((car) => car.type_carrosserie).filter(Boolean))).sort(),
    [cars],
  );
  const financeByCar = useMemo(
    () => new Map(finances.map((finance) => [finance.car_id, finance])),
    [finances],
  );
  const filteredCars = useMemo(() => {
    const query = filters.q.trim().toLocaleLowerCase("fr");
    const priceMin = filters.prixMin === "" ? null : Number(filters.prixMin);
    const priceMax = filters.prixMax === "" ? null : Number(filters.prixMax);
    const yearMin = filters.anneeMin === "" ? null : Number(filters.anneeMin);
    const yearMax = filters.anneeMax === "" ? null : Number(filters.anneeMax);

    return cars
      .filter((car) => {
        if (
          query &&
          ![car.marque, car.modele, car.slug, car.couleur]
            .filter(Boolean)
            .some((value) => value.toLocaleLowerCase("fr").includes(query))
        ) {
          return false;
        }
        if (filters.marque && car.marque !== filters.marque) return false;
        if (filters.carburant && car.carburant !== filters.carburant) return false;
        if (filters.boite && car.boite !== filters.boite) return false;
        if (filters.carrosserie && car.type_carrosserie !== filters.carrosserie) return false;
        if (filters.statut && car.statut !== filters.statut) return false;
        if (filters.vedette && String(car.is_featured) !== filters.vedette) return false;
        if (priceMin !== null && Number.isFinite(priceMin) && car.prix < priceMin) return false;
        if (priceMax !== null && Number.isFinite(priceMax) && car.prix > priceMax) return false;
        if (yearMin !== null && Number.isFinite(yearMin) && car.annee < yearMin) return false;
        if (yearMax !== null && Number.isFinite(yearMax) && car.annee > yearMax) return false;
        return true;
      })
      .sort((a, b) => {
        if (filters.tri === "prix_asc") return a.prix - b.prix;
        if (filters.tri === "prix_desc") return b.prix - a.prix;
        if (filters.tri === "annee_desc") return b.annee - a.annee;
        if (filters.tri === "anciennes_stock") {
          return (
            (getStockDays(b, financeByCar.get(b.id)) ?? -1) -
            (getStockDays(a, financeByCar.get(a.id)) ?? -1)
          );
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [cars, filters, financeByCar]);

  const activeFilters = FILTER_PARAMS.filter(
    (key) => filters[key] && !(key === "tri" && filters.tri === DEFAULT_FILTERS.tri),
  );

  const filterLabels: Record<keyof CarFilters, string> = {
    q: "Recherche",
    marque: "Marque",
    carburant: "Carburant",
    boite: "Boîte",
    carrosserie: "Carrosserie",
    statut: "Statut",
    vedette: "Vedette",
    prixMin: "Prix min.",
    prixMax: "Prix max.",
    anneeMin: "Année min.",
    anneeMax: "Année max.",
    tri: "Tri",
  };

  const filterValueLabel = (key: keyof CarFilters) => {
    if (key === "vedette") return filters.vedette === "true" ? "Oui" : "Non";
    if (key === "statut") return STATUS_LABELS[filters.statut as CarStatus]?.label ?? filters.statut;
    if (key === "tri") return SORT_OPTIONS.find(([value]) => value === filters.tri)?.[1] ?? filters.tri;
    return filters[key];
  };

  const handleToggleFeatured = (car: Car) => {
    setActionError("");
    startTransition(async () => {
      const result = await toggleCarFeaturedAction(car.id, car.is_featured);
      if (result.success) {
        setCars((prev) =>
          prev.map((c) => (c.id === car.id ? { ...c, is_featured: !c.is_featured } : c))
        );
      } else {
        setActionError(result.message);
      }
    });
  };

  const persistStatusChange = (
    car: Car,
    newStatus: CarStatus,
    sale?: CarSaleDetails,
    clearSaleData?: boolean,
    privateFinance?: Pick<CarSaleDetails, "prix_achat" | "frais" | "notes">,
    onSuccess?: () => void,
  ) => {
    setActionError("");
    startTransition(async () => {
      const result = await updateCarStatusAction(
        car.id,
        newStatus,
        sale,
        clearSaleData,
        privateFinance,
      );
      if (result.success) {
        setCars((prev) =>
          prev.map((c) => (c.id === car.id ? { ...c, statut: newStatus } : c))
        );
        if (sale) {
          setFinances((prev) => [
            ...prev.filter((finance) => finance.car_id !== car.id),
            {
              car_id: car.id,
              prix_achat: sale.prix_achat,
              frais: sale.frais,
              prix_vente: sale.prix_vente,
              date_vente: sale.date_vente,
              acheteur: sale.acheteur || null,
              notes: sale.notes || null,
            },
          ]);
        } else if (newStatus === "disponible" && typeof clearSaleData === "boolean") {
          setFinances((prev) =>
            prev.map((finance) =>
              finance.car_id === car.id && clearSaleData
                ? { ...finance, prix_vente: null, date_vente: null, acheteur: null }
                : finance,
            )
          );
        }
        onSuccess?.();
      } else {
        setActionError(result.message);
      }
    });
  };

  const handleStatusChange = (car: Car, newStatus: CarStatus) => {
    if (newStatus === "vendue" && car.statut !== "vendue") {
      setConfirmSaleCar(car);
      return;
    }
    if (newStatus === "disponible" && car.statut === "vendue") {
      setConfirmSaleReversalCar(car);
      return;
    }
    persistStatusChange(car, newStatus);
  };

  const confirmSale = (sale: CarSaleDetails) => {
    if (!confirmSaleCar) return;
    persistStatusChange(confirmSaleCar, "vendue", sale, undefined, undefined, () => {
      setConfirmSaleCar(null);
    });
  };

  const confirmSaleReversal = (clearSaleData: boolean) => {
    if (!confirmSaleReversalCar) return;
    const finance = finances.find(
      (record) => record.car_id === confirmSaleReversalCar.id,
    );
    persistStatusChange(
      confirmSaleReversalCar,
      "disponible",
      undefined,
      clearSaleData,
      {
        prix_achat: finance?.prix_achat ?? null,
        frais: finance?.frais ?? null,
        notes: finance?.notes ?? "",
      },
      () => setConfirmSaleReversalCar(null),
    );
  };

  const executeDelete = () => {
    if (!confirmDeleteCar) return;
    const carId = confirmDeleteCar.id;
    setDeletingId(carId);
    setActionError("");

    startTransition(async () => {
      const result = await deleteCarAction(carId);
      if (result.success) {
        setCars((prev) => prev.filter((c) => c.id !== carId));
        setConfirmDeleteCar(null);
      } else {
        setActionError(result.message);
      }
      setDeletingId(null);
    });
  };

  const statusCounts: Record<CarStatus, number> = {
    disponible: availableCount,
    reservee: reservedCount,
    vendue: soldCount,
    brouillon: cars.filter((c) => c.statut === "brouillon").length,
  };
  const STATUS_CHIPS: CarStatus[] = ["disponible", "reservee", "vendue", "brouillon"];

  const statusSelect = (car: Car) => {
    const badge = STATUS_LABELS[car.statut] || STATUS_LABELS.disponible;
    return (
      <select
        value={car.statut}
        disabled={isPending}
        onChange={(e) => handleStatusChange(car, e.target.value as CarStatus)}
        className={`status-select ${badge.className}`}
        aria-label={`Statut de ${car.marque} ${car.modele}`}
      >
        <option value="disponible">Disponible</option>
        <option value="reservee">Réservée</option>
        <option value="vendue">Vendue</option>
        <option value="brouillon">Brouillon</option>
      </select>
    );
  };

  const daysBadge = (car: Car) => {
    const days = getStockDays(car, financeByCar.get(car.id));
    if (days === null) return <span className="text-fg-3">—</span>;
    return (
      <span
        className={`mono inline-flex items-center gap-1 ${days > 60 && car.statut !== "vendue" ? "font-semibold text-warn" : "text-fg-2"}`}
        title={car.statut === "vendue" ? "Durée avant la vente" : "Durée depuis l'ajout"}
      >
        {days > 60 && car.statut !== "vendue" && <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />}
        {days} j
      </span>
    );
  };

  const featuredButton = (car: Car) => (
    <button
      type="button"
      disabled={isPending}
      onClick={() => handleToggleFeatured(car)}
      title={car.is_featured ? "En vedette (cliquer pour retirer)" : "Mettre en vedette"}
      className="icon-btn"
      aria-pressed={car.is_featured}
      aria-label={car.is_featured ? "Retirer de la vedette" : "Mettre en vedette"}
    >
      <Star className={car.is_featured ? "fill-warn text-warn" : ""} />
    </button>
  );

  const rowActions = (car: Car) => (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/voitures/${car.slug || car.id}`}
        target="_blank"
        title="Voir sur le site public"
        className="icon-btn"
        aria-label="Voir sur le site public"
      >
        <Eye />
      </Link>
      <Link href={`/admin/voitures/${car.id}/modifier`} className="icon-btn" title="Modifier" aria-label="Modifier">
        <Pencil />
      </Link>
      <button
        type="button"
        disabled={deletingId === car.id}
        onClick={() => setConfirmDeleteCar(car)}
        className="icon-btn danger"
        title="Supprimer"
        aria-label="Supprimer"
      >
        <Trash2 />
      </button>
    </div>
  );

  return (
    <div className="grid gap-4">
      {/* Status tiles double as quick filters */}
      <div className="kpis">
        <button
          type="button"
          className="kpi text-left"
          aria-pressed={!filters.statut}
          onClick={() => updateFilters({ statut: "" })}
          style={!filters.statut ? { borderColor: "var(--brand)" } : undefined}
        >
          <span className="kpi-label">Tous les véhicules</span>
          <span className="kpi-value">{totalCars}</span>
          <span className="kpi-foot">au showroom</span>
        </button>
        {STATUS_CHIPS.map((status) => (
          <button
            key={status}
            type="button"
            className="kpi text-left"
            aria-pressed={filters.statut === status}
            onClick={() => updateFilters({ statut: filters.statut === status ? "" : status })}
            style={filters.statut === status ? { borderColor: "var(--brand)" } : undefined}
          >
            <span className="kpi-label">
              <span className={`pill ${STATUS_LABELS[status].className}`}>{STATUS_LABELS[status].label}</span>
            </span>
            <span className="kpi-value">{statusCounts[status]}</span>
            <span className="kpi-foot">
              {status === "disponible" ? "en vente" : status === "reservee" ? "en attente" : status === "vendue" ? "conclues" : "non publiés"}
            </span>
          </button>
        ))}
      </div>

      {actionError && (
        <p className="alert alert-bad" role="alert">
          <TriangleAlert aria-hidden="true" /> {actionError}
        </p>
      )}

      <section className="panel overflow-hidden">
        {/* Search, filters and sorting */}
        <div className="filterbar">
          <label className="relative min-w-0 flex-1 sm:max-w-sm">
            <span className="sr-only">Rechercher</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-3" aria-hidden="true" />
            <input
              type="search"
              placeholder="Marque, modèle, slug ou couleur…"
              value={filters.q}
              onChange={(event) => updateFilters({ q: event.target.value }, "replace")}
              className="field field-sm !pl-9 !pr-9"
            />
            {filters.q && (
              <button
                type="button"
                onClick={() => updateFilters({ q: "" })}
                className="icon-btn absolute right-0.5 top-1/2 -translate-y-1/2"
                aria-label="Effacer la recherche"
              >
                <X />
              </button>
            )}
          </label>

          <button
            type="button"
            aria-expanded={showFiltersMobile}
            aria-controls="admin-car-filters"
            onClick={() => setShowFiltersMobile((visible) => !visible)}
            className="btn btn-ghost btn-sm"
          >
            <Filter aria-hidden="true" />
            Filtres
            {activeFilters.length > 0 && (
              <span className="mono rounded-full bg-brand px-1.5 text-[0.7rem] text-white">{activeFilters.length}</span>
            )}
            <ChevronDown className={`transition-transform ${showFiltersMobile ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>

          <label className="ml-auto flex items-center gap-2">
            <span className="hidden text-xs text-fg-3 sm:inline">Trier</span>
            <select
              id="admin-car-sort"
              value={filters.tri}
              onChange={(event) => updateFilters({ tri: event.target.value })}
              className="field field-sm min-w-44"
            >
              {SORT_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        </div>

        <div
          id="admin-car-filters"
          className={`${showFiltersMobile ? "grid" : "hidden"} grid-cols-1 gap-3 border-b border-line bg-surface-2 p-4 sm:grid-cols-2 lg:grid-cols-5`}
        >
          <label>
            <span className="label">Marque</span>
            <select value={filters.marque} onChange={(event) => updateFilters({ marque: event.target.value })} className="field field-sm">
              <option value="">Toutes les marques</option>
              {brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
            </select>
          </label>
          <label>
            <span className="label">Carburant</span>
            <select value={filters.carburant} onChange={(event) => updateFilters({ carburant: event.target.value })} className="field field-sm">
              <option value="">Tous les carburants</option>
              {carburants.map((fuel: CarFuel) => <option key={fuel} value={fuel}>{fuel}</option>)}
            </select>
          </label>
          <label>
            <span className="label">Boîte</span>
            <select value={filters.boite} onChange={(event) => updateFilters({ boite: event.target.value })} className="field field-sm">
              <option value="">Toutes les boîtes</option>
              {transmissions.map((transmission: CarTransmission) => (
                <option key={transmission} value={transmission}>{transmission}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="label">Carrosserie</span>
            <select value={filters.carrosserie} onChange={(event) => updateFilters({ carrosserie: event.target.value })} className="field field-sm">
              <option value="">Toutes les carrosseries</option>
              {carrosseries.map((body) => <option key={body} value={body}>{body}</option>)}
            </select>
          </label>
          <label>
            <span className="label">Vedette</span>
            <select value={filters.vedette} onChange={(event) => updateFilters({ vedette: event.target.value })} className="field field-sm">
              <option value="">Toutes</option>
              <option value="true">Oui</option>
              <option value="false">Non</option>
            </select>
          </label>
          <label>
            <span className="label">Prix min. (DA)</span>
            <input type="number" min="0" value={filters.prixMin} onChange={(event) => updateFilters({ prixMin: event.target.value }, "replace")} className="field field-sm" />
          </label>
          <label>
            <span className="label">Prix max. (DA)</span>
            <input type="number" min="0" value={filters.prixMax} onChange={(event) => updateFilters({ prixMax: event.target.value }, "replace")} className="field field-sm" />
          </label>
          <label>
            <span className="label">Année min.</span>
            <input type="number" min="1900" max="2100" value={filters.anneeMin} onChange={(event) => updateFilters({ anneeMin: event.target.value }, "replace")} className="field field-sm" />
          </label>
          <label>
            <span className="label">Année max.</span>
            <input type="number" min="1900" max="2100" value={filters.anneeMax} onChange={(event) => updateFilters({ anneeMax: event.target.value }, "replace")} className="field field-sm" />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-2.5">
          <p className="text-[0.82rem] text-fg-3" aria-live="polite">
            <strong className="text-fg">{filteredCars.length} véhicule{filteredCars.length !== 1 ? "s" : ""}</strong> sur {totalCars}
          </p>
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {activeFilters.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => updateFilters({ [key]: DEFAULT_FILTERS[key] })}
                  className="chip !min-h-7 !px-2.5 !text-xs"
                  aria-label={`Supprimer le filtre ${filterLabels[key]}`}
                >
                  {filterLabels[key]} : {filterValueLabel(key)}
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              ))}
              <button type="button" onClick={resetFilters} className="btn btn-ghost btn-sm !min-h-7">
                <RotateCcw aria-hidden="true" /> Réinitialiser
              </button>
            </div>
          )}
        </div>

        {filteredCars.length === 0 ? (
          <p className="px-5 py-14 text-center text-sm text-fg-3">Aucun véhicule trouvé pour ces critères.</p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="table-wrap hidden md:block">
              <table className="table">
                <thead>
                  <tr>
                    <th>Véhicule</th>
                    <th>Année / Km</th>
                    <th>En stock</th>
                    <th className="!text-right">Prix</th>
                    <th>Statut</th>
                    <th className="!text-center">Vedette</th>
                    <th className="!text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCars.map((car) => {
                    const cover = car.cover_image_url || car.images[0]?.url;
                    return (
                      <tr key={car.id}>
                        <td>
                          <Link href={`/admin/voitures/${car.id}/modifier`} className="flex items-center gap-3">
                            <span className="thumb">
                              <CarImage src={cover} alt={`${car.marque} ${car.modele}`} fill sizes="74px" className="object-cover" />
                            </span>
                            <span className="min-w-0">
                              <span className="cell-main block">{car.marque} {car.modele}</span>
                              <span className="cell-sub block">
                                {car.version || car.type_carrosserie} · {car.carburant} · {car.boite}
                              </span>
                            </span>
                          </Link>
                        </td>
                        <td>
                          <div className="mono">{car.annee}</div>
                          <div className="cell-sub">{formatKm(car.kilometrage)}</div>
                        </td>
                        <td className="whitespace-nowrap">{daysBadge(car)}</td>
                        <td className="t-num">
                          <span className="font-semibold text-fg">{formatPriceDZD(car.prix)}</span>
                          {car.negotiable && <span className="cell-sub block">Négociable</span>}
                        </td>
                        <td className="whitespace-nowrap">{statusSelect(car)}</td>
                        <td className="text-center">{featuredButton(car)}</td>
                        <td>{rowActions(car)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="divide-y divide-line md:hidden">
              {filteredCars.map((car) => {
                const cover = car.cover_image_url || car.images[0]?.url;
                return (
                  <li key={car.id} className="grid gap-3 p-4">
                    <Link href={`/admin/voitures/${car.id}/modifier`} className="flex items-center gap-3">
                      <span className="thumb !w-24">
                        <CarImage src={cover} alt={`${car.marque} ${car.modele}`} fill sizes="96px" className="object-cover" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="cell-main block truncate">{car.marque} {car.modele}</span>
                        <span className="cell-sub block truncate">{car.annee} · {formatKm(car.kilometrage)}</span>
                        <span className="mono mt-1 block text-sm font-semibold">{formatPriceDZD(car.prix)}</span>
                      </span>
                    </Link>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {statusSelect(car)}
                        {daysBadge(car)}
                      </div>
                      <div className="flex items-center">
                        {featuredButton(car)}
                        {rowActions(car)}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      {confirmSaleCar && (
        <SaleConfirmationDialog
          key={confirmSaleCar.id}
          listedPrice={confirmSaleCar.prix}
          initialFinance={finances.find((finance) => finance.car_id === confirmSaleCar.id)}
          pending={isPending}
          onCancel={() => setConfirmSaleCar(null)}
          onConfirm={confirmSale}
        />
      )}
      {confirmSaleReversalCar && (
        <SaleReversalDialog
          pending={isPending}
          onCancel={() => setConfirmSaleReversalCar(null)}
          onChoose={confirmSaleReversal}
        />
      )}

      {/* Delete confirmation */}
      {confirmDeleteCar && (
        <div className="dialog-backdrop">
          <section role="dialog" aria-modal="true" aria-labelledby="delete-title" className="dialog !max-w-md">
            <div className="dialog-head">
              <span className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-bad-soft text-bad">
                <Trash2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 id="delete-title">Supprimer ce véhicule ?</h2>
            </div>
            <div className="dialog-body space-y-2 text-sm">
              <p className="text-fg-2">
                <strong className="text-fg">
                  {confirmDeleteCar.marque} {confirmDeleteCar.modele} ({confirmDeleteCar.annee})
                </strong>{" "}
                sera supprimé définitivement.
              </p>
              <p className="text-fg-3">
                Toutes les photos associées seront aussi supprimées du stockage. Cette opération est irréversible.
              </p>
            </div>
            <div className="dialog-foot">
              <button type="button" disabled={isPending} onClick={() => setConfirmDeleteCar(null)} className="btn btn-ghost">
                Annuler
              </button>
              <button type="button" disabled={isPending} onClick={executeDelete} className="btn btn-danger">
                {isPending ? "Suppression…" : "Supprimer définitivement"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
