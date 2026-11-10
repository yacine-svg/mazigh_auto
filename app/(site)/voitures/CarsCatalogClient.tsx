"use client";

import { useState, useMemo } from "react";
import { useLenis } from "lenis/react";
import type { Car } from "@/app/data/cars";
import { CarCard } from "@/app/components/site/CarCard";
import {
  Car as CarIcon,
  Search,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";

type CarsCatalogClientProps = {
  initialCars: Car[];
};

export function CarsCatalogClient({ initialCars }: CarsCatalogClientProps) {
  const lenis = useLenis();

  // Search & Filters State
  const [search, setSearch] = useState("");
  const [selectedMarque, setSelectedMarque] = useState("all");
  const [selectedCarburant, setSelectedCarburant] = useState("all");
  const [selectedBoite, setSelectedBoite] = useState("all");
  const [selectedCarrosserie, setSelectedCarrosserie] = useState("all");
  const [selectedEtat, setSelectedEtat] = useState("all");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [minYear, setMinYear] = useState<number | "">("");
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc" | "year_desc">("newest");
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Reset page when any filter changes
  const filterKey = `${search}-${selectedMarque}-${selectedCarburant}-${selectedBoite}-${selectedCarrosserie}-${selectedEtat}-${maxPrice}-${minYear}-${sortBy}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setCurrentPage(1);
  }

  // Extract unique filter options
  const marques = useMemo(() => {
    return Array.from(new Set(initialCars.map((c) => c.marque).filter(Boolean))).sort();
  }, [initialCars]);

  const carburants = useMemo(() => {
    return Array.from(new Set(initialCars.map((c) => c.carburant).filter(Boolean))).sort();
  }, [initialCars]);

  const carrosseries = useMemo(() => {
    return Array.from(new Set(initialCars.map((c) => c.type_carrosserie).filter(Boolean))).sort();
  }, [initialCars]);

  // Filter & sort cars
  const filteredCars = useMemo(() => {
    return initialCars
      .filter((car) => {
        // Search query
        if (search.trim()) {
          const q = search.toLowerCase();
          const matches =
            car.marque.toLowerCase().includes(q) ||
            car.modele.toLowerCase().includes(q) ||
            car.version?.toLowerCase().includes(q) ||
            car.couleur?.toLowerCase().includes(q);
          if (!matches) return false;
        }

        // Dropdown filters
        if (selectedMarque !== "all" && car.marque !== selectedMarque) return false;
        if (selectedCarburant !== "all" && car.carburant !== selectedCarburant) return false;
        if (selectedBoite !== "all" && car.boite !== selectedBoite) return false;
        if (selectedCarrosserie !== "all" && car.type_carrosserie !== selectedCarrosserie) return false;
        if (selectedEtat !== "all" && car.etat !== selectedEtat) return false;

        // Numeric ranges
        if (maxPrice !== "" && car.prix > Number(maxPrice)) return false;
        if (minYear !== "" && car.annee < Number(minYear)) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price_asc") return a.prix - b.prix;
        if (sortBy === "price_desc") return b.prix - a.prix;
        if (sortBy === "year_desc") return b.annee - a.annee;
        // Default newest
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [
    initialCars,
    search,
    selectedMarque,
    selectedCarburant,
    selectedBoite,
    selectedCarrosserie,
    selectedEtat,
    maxPrice,
    minYear,
    sortBy,
  ]);

  const resetFilters = () => {
    setSearch("");
    setSelectedMarque("all");
    setSelectedCarburant("all");
    setSelectedBoite("all");
    setSelectedCarrosserie("all");
    setSelectedEtat("all");
    setMaxPrice("");
    setMinYear("");
    setSortBy("newest");
  };

  const hasActiveFilters =
    search !== "" ||
    selectedMarque !== "all" ||
    selectedCarburant !== "all" ||
    selectedBoite !== "all" ||
    selectedCarrosserie !== "all" ||
    selectedEtat !== "all" ||
    maxPrice !== "" ||
    minYear !== "";

  const pageCount = Math.ceil(filteredCars.length / ITEMS_PER_PAGE);
  const goToPage = (page: number) => {
    setCurrentPage(page);
    lenis?.scrollTo("#catalogue-grid", { offset: -110, duration: 1.1 });
  };
  const brandCounts = new Map<string, number>();
  for (const car of initialCars) brandCounts.set(car.marque, (brandCounts.get(car.marque) ?? 0) + 1);

  return (
    <div className="space-y-8">
      {/* Search, brand chips and filters */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative block flex-1">
            <span className="sr-only">Rechercher un véhicule</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-3" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une marque, un modèle (ex : Golf, 320d, Clio)…"
              className="field !min-h-[3.25rem] !rounded-full !pl-11 !pr-12"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full text-fg-3 hover:text-fg"
                aria-label="Effacer la recherche"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-expanded={showFiltersMobile}
              aria-controls="catalog-filters"
              onClick={() => setShowFiltersMobile((visible) => !visible)}
              className="btn btn-ghost lg:hidden"
            >
              <SlidersHorizontal aria-hidden="true" />
              Filtres
              {hasActiveFilters && <span className="h-2 w-2 rounded-full bg-brand" />}
            </button>
            <label className="flex flex-1 items-center gap-2 lg:flex-none">
              <span className="sr-only">Trier par</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "newest" | "price_asc" | "price_desc" | "year_desc")}
                className="field !min-h-[3.25rem] !rounded-full lg:min-w-52"
              >
                <option value="newest">Plus récents</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
                <option value="year_desc">Année récente</option>
              </select>
            </label>
          </div>
        </div>

        {marques.length > 1 && (
          <div className="no-scrollbar -mx-[max(1.25rem,3.5vw)] flex gap-2 overflow-x-auto px-[max(1.25rem,3.5vw)] pb-1" data-lenis-prevent>
            <button type="button" className="chip" aria-pressed={selectedMarque === "all"} onClick={() => setSelectedMarque("all")}>
              Toutes <b>{initialCars.length}</b>
            </button>
            {marques.map((m) => (
              <button
                key={m}
                type="button"
                className="chip"
                aria-pressed={selectedMarque === m}
                onClick={() => setSelectedMarque(selectedMarque === m ? "all" : m)}
              >
                {m} <b>{brandCounts.get(m) ?? 0}</b>
              </button>
            ))}
          </div>
        )}

        <div
          id="catalog-filters"
          className={`grid-cols-2 gap-3 rounded-[18px] border border-line bg-surface p-4 sm:grid-cols-3 lg:grid lg:grid-cols-5 ${
            showFiltersMobile ? "grid" : "hidden"
          }`}
        >
          <label>
            <span className="label">Carburant</span>
            <select value={selectedCarburant} onChange={(e) => setSelectedCarburant(e.target.value)} className="field field-sm">
              <option value="all">Tous</option>
              {carburants.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="label">Boîte</span>
            <select value={selectedBoite} onChange={(e) => setSelectedBoite(e.target.value)} className="field field-sm">
              <option value="all">Toutes</option>
              <option value="Manuelle">Manuelle</option>
              <option value="Automatique">Automatique</option>
            </select>
          </label>
          <label>
            <span className="label">Carrosserie</span>
            <select value={selectedCarrosserie} onChange={(e) => setSelectedCarrosserie(e.target.value)} className="field field-sm">
              <option value="all">Toutes</option>
              {carrosseries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="label">Prix max (DA)</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="ex : 4000000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : "")}
              className="field field-sm"
            />
          </label>
          <label>
            <span className="label">Année min</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="ex : 2018"
              value={minYear}
              onChange={(e) => setMinYear(e.target.value ? Number(e.target.value) : "")}
              className="field field-sm"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-fg-3" aria-live="polite">
            <span className="text-fg">{filteredCars.length}</span> véhicule{filteredCars.length !== 1 ? "s" : ""}
            {hasActiveFilters ? " trouvé" + (filteredCars.length !== 1 ? "s" : "") : " au catalogue"}
          </p>
          {hasActiveFilters && (
            <button type="button" onClick={resetFilters} className="link-arrow">
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Cars Grid */}
      {filteredCars.length === 0 ? (
        <div className="rounded-[22px] border border-line bg-surface px-6 py-16 text-center">
          <CarIcon className="mx-auto h-10 w-10 text-fg-3" aria-hidden="true" />
          <h3 className="display mt-5 text-2xl">Aucune voiture trouvée</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-fg-3">
            Aucun véhicule ne correspond à vos filtres. Essayez d&apos;élargir vos critères.
          </p>
          <button type="button" onClick={resetFilters} className="btn btn-primary mt-6">
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <>
          <div id="catalogue-grid" className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredCars
              .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
              .map((car, index) => (
                <CarCard key={car.id} car={car} priority={currentPage === 1 && index < 2} />
              ))}
          </div>

          {/* Pagination (12 cars per page) */}
          {pageCount > 1 && (
            <nav className="flex items-center justify-center gap-2 pt-6" aria-label="Pagination">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => goToPage(Math.max(1, currentPage - 1))}
                className="btn btn-ghost btn-icon"
                aria-label="Page précédente"
              >
                <ChevronLeft />
              </button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => goToPage(page)}
                  aria-current={currentPage === page ? "page" : undefined}
                  className={`mono grid h-10 w-10 place-items-center rounded-full text-sm transition-colors ${
                    currentPage === page ? "bg-brand text-white" : "text-fg-3 hover:bg-surface-2 hover:text-fg"
                  }`}
                >
                  {String(page).padStart(2, "0")}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage >= pageCount}
                onClick={() => goToPage(Math.min(pageCount, currentPage + 1))}
                className="btn btn-ghost btn-icon"
                aria-label="Page suivante"
              >
                <ChevronRight />
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
