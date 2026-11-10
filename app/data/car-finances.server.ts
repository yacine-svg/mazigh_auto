import "server-only";

import { requireShowroomOwner } from "@/app/data/admin-auth.server";
import type { CarFinance, FinanceCarSummary } from "@/app/data/car-finances";
import { createClient } from "@/utils/supabase/server";
import { MOCK_CARS, MOCK_FINANCES } from "./mock";

export type AdminFinanceResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

function logFinanceError(context: string, error: { code?: string; message?: string }) {
  console.error(`${context}:`, { code: error.code, message: error.message });
}

export async function getAdminCarFinances(
  carIds?: string[],
): Promise<AdminFinanceResult<CarFinance[]>> {
  await requireShowroomOwner();
  if (process.env.MOCK_DATA) return { data: MOCK_FINANCES, error: null };

  try {
    const supabase = await createClient();
    let query = supabase
      .from("car_finances")
      .select("car_id, prix_achat, frais, prix_vente, date_vente, acheteur, notes");

    if (carIds) {
      if (carIds.length === 0) return { data: [], error: null };
      query = query.in("car_id", carIds);
    }

    const { data, error } = await query;
    if (error) {
      logFinanceError("Unable to load private car finances", error);
      return { data: null, error: "Impossible de charger les informations financières." };
    }

    return { data: (data ?? []) as CarFinance[], error: null };
  } catch (error) {
    console.error("Unable to load private car finances:", error);
    return { data: null, error: "Impossible de charger les informations financières." };
  }
}

export async function getAdminCarFinance(
  carId: string,
): Promise<AdminFinanceResult<CarFinance | null>> {
  await requireShowroomOwner();
  if (process.env.MOCK_DATA) return { data: MOCK_FINANCES.find(f => f.car_id === carId) ?? null, error: null };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("car_finances")
      .select("car_id, prix_achat, frais, prix_vente, date_vente, acheteur, notes")
      .eq("car_id", carId)
      .maybeSingle();

    if (error) {
      logFinanceError("Unable to load private car finance", error);
      return { data: null, error: "Impossible de charger les informations financières." };
    }

    return { data: data as CarFinance | null, error: null };
  } catch (error) {
    console.error("Unable to load private car finance:", error);
    return { data: null, error: "Impossible de charger les informations financières." };
  }
}

export type AdminFinanceDashboardData = {
  cars: FinanceCarSummary[];
  finances: CarFinance[];
};

export async function getAdminFinanceDashboardData(): Promise<
  AdminFinanceResult<AdminFinanceDashboardData>
> {
  await requireShowroomOwner();
  if (process.env.MOCK_DATA) return { data: { cars: MOCK_CARS, finances: MOCK_FINANCES }, error: null };

  try {
    const supabase = await createClient();
    const [carsResult, financesResult] = await Promise.all([
      supabase
        .from("cars")
        .select("id, marque, modele, version, annee, prix, statut, slug"),
      supabase
        .from("car_finances")
        .select("car_id, prix_achat, frais, prix_vente, date_vente, acheteur, notes"),
    ]);

    if (carsResult.error) {
      logFinanceError("Unable to load cars for finance dashboard", carsResult.error);
      return { data: null, error: "Impossible de charger les données financières." };
    }
    if (financesResult.error) {
      logFinanceError("Unable to load finance dashboard records", financesResult.error);
      return { data: null, error: "Impossible de charger les données financières." };
    }

    return {
      data: {
        cars: (carsResult.data ?? []) as FinanceCarSummary[],
        finances: (financesResult.data ?? []) as CarFinance[],
      },
      error: null,
    };
  } catch (error) {
    console.error("Unable to load finance dashboard:", error);
    return { data: null, error: "Impossible de charger les données financières." };
  }
}
