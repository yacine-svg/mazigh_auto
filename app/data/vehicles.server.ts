import "server-only";

import { cache } from "react";
import { unstable_rethrow } from "next/navigation";
import { requireShowroomOwner } from "@/app/data/admin-auth.server";
import { createClient } from "@/utils/supabase/server";
import type { Car, CarFuel, CarImage, CarStatus } from "./cars";
import { STATUS_LABELS } from "./cars";
import { MOCK_CARS } from "./mock";

export type { Car };

export type VehicleQueryError = {
  code: string;
  message: string;
};

export type VehicleQueryResult<T> =
  | { data: T; error: null }
  | { data: null; error: VehicleQueryError };

type RawCarRow = {
  id: string;
  created_at: string;
  updated_at?: string;
  marque: string;
  modele: string;
  version?: string;
  annee: number;
  prix: number | string;
  negotiable?: boolean;
  kilometrage: number;
  carburant: string;
  boite: string;
  moteur?: string;
  cylindree?: string;
  puissance?: string;
  couleur?: string;
  type_carrosserie?: string;
  options?: string[];
  description?: string;
  etat?: string;
  papiers?: string;
  statut: string;
  is_featured?: boolean;
  slug?: string;
  car_images?: Array<{
    id: string;
    car_id: string;
    url: string;
    position: number;
    is_cover: boolean;
    created_at?: string;
  }>;
};

function mapCar(row: RawCarRow): Car {
  const sortedImages: CarImage[] = (row.car_images ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((img) => ({
      id: img.id,
      car_id: img.car_id,
      url: img.url,
      position: img.position,
      is_cover: img.is_cover,
      created_at: img.created_at,
    }));

  const coverImg =
    sortedImages.find((img) => img.is_cover)?.url ||
    sortedImages[0]?.url ||
    "";

  const numPrix = Number(row.prix) || 0;
  const numKm = Number(row.kilometrage) || 0;
  const rawStatut = (row.statut || "disponible").toLowerCase() as CarStatus;
  const statut: CarStatus = ["disponible", "reservee", "vendue", "brouillon"].includes(rawStatut)
    ? rawStatut
    : "disponible";

  const carburant = (row.carburant || "Essence") as CarFuel;
  const boite = (row.boite === "Automatique" ? "Automatique" : "Manuelle");

  const formattedMileage = `${new Intl.NumberFormat("fr-DZ", {
    maximumFractionDigits: 0,
  }).format(numKm)} km`;

  return {
    id: row.id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    marque: row.marque || "",
    modele: row.modele || "",
    version: row.version || "",
    annee: row.annee || 2020,
    prix: numPrix,
    negotiable: Boolean(row.negotiable),
    kilometrage: numKm,
    carburant,
    boite,
    moteur: row.moteur || "",
    cylindree: row.cylindree || "",
    puissance: row.puissance || "",
    couleur: row.couleur || "",
    type_carrosserie: row.type_carrosserie || "Berline",
    options: row.options ?? [],
    description: row.description || "",
    etat: row.etat === "Neuve" ? "Neuve" : "Occasion",
    papiers: row.papiers || "Carte grise",
    statut,
    is_featured: Boolean(row.is_featured),
    slug: row.slug || row.id,
    images: sortedImages,
    cover_image_url: coverImg,

    // Compatibility aliases for legacy views
    make: row.marque || "",
    model: row.modele || "",
    year: row.annee || 2020,
    price: numPrix,
    mileage: formattedMileage,
    fuel: carburant,
    transmission: boite,
    color: row.couleur || "",
    features: row.options ?? [],
    coverImageUrl: coverImg,
    status: STATUS_LABELS[statut]?.label || "Disponible",
  };
}

function toQueryError(error: unknown): VehicleQueryError {
  const queryError = error as { code?: string; message?: string };
  const result = {
    code: queryError.code ?? "SUPABASE_QUERY_FAILED",
    message: queryError.message ?? "Unknown Supabase query error",
  };

  console.error("Unable to query cars from Supabase:", result);
  return result;
}

export const getPublicVehicles = cache(
  async (): Promise<VehicleQueryResult<Car[]>> => {
    if (process.env.MOCK_DATA) return { data: MOCK_CARS.filter(c => c.statut !== "brouillon"), error: null };
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("cars")
        .select("*, car_images(*)")
        .neq("statut", "brouillon")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        return { data: null, error: toQueryError(error) };
      }

      return {
        data: ((data ?? []) as unknown as RawCarRow[]).map(mapCar),
        error: null,
      };
    } catch (error) {
      unstable_rethrow(error);
      return { data: null, error: toQueryError(error) };
    }
  },
);

export const getAdminVehicles = cache(
  async (): Promise<VehicleQueryResult<Car[]>> => {
    if (process.env.MOCK_DATA) return { data: MOCK_CARS, error: null };
    try {
      await requireShowroomOwner();

      const supabase = await createClient();
      const { data, error } = await supabase
        .from("cars")
        .select("*, car_images(*)")
        .order("created_at", { ascending: false });

      if (error) {
        return { data: null, error: toQueryError(error) };
      }

      return {
        data: ((data ?? []) as unknown as RawCarRow[]).map(mapCar),
        error: null,
      };
    } catch (error) {
      unstable_rethrow(error);
      return { data: null, error: toQueryError(error) };
    }
  },
);

export const getPublicVehicleBySlug = cache(
  async (slug: string): Promise<VehicleQueryResult<Car | null>> => {
    if (process.env.MOCK_DATA) return { data: MOCK_CARS.find(c => c.slug === slug || c.id === slug) ?? null, error: null };
    try {
      const supabase = await createClient();
      const decoded = decodeURIComponent(slug).trim();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decoded);

      let query = supabase
        .from("cars")
        .select("*, car_images(*)")
        .neq("statut", "brouillon");

      if (isUuid) {
        query = query.or(`id.eq.${decoded},slug.eq.${decoded}`);
      } else {
        query = query.ilike("slug", decoded);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        return { data: null, error: toQueryError(error) };
      }

      return {
        data: data ? mapCar(data as unknown as RawCarRow) : null,
        error: null,
      };
    } catch (error) {
      unstable_rethrow(error);
      return { data: null, error: toQueryError(error) };
    }
  },
);

export const getCarById = cache(
  async (id: string): Promise<VehicleQueryResult<Car | null>> => {
    if (process.env.MOCK_DATA) return { data: MOCK_CARS.find(c => c.id === id) ?? null, error: null };
    try {
      await requireShowroomOwner();

      const supabase = await createClient();
      const decoded = decodeURIComponent(id).trim();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decoded);

      let query = supabase.from("cars").select("*, car_images(*)");
      if (isUuid) {
        query = query.eq("id", decoded);
      } else {
        query = query.ilike("slug", decoded);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        return { data: null, error: toQueryError(error) };
      }

      return {
        data: data ? mapCar(data as unknown as RawCarRow) : null,
        error: null,
      };
    } catch (error) {
      unstable_rethrow(error);
      return { data: null, error: toQueryError(error) };
    }
  },
);
