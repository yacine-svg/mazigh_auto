import { CircleAlert } from "lucide-react";
import { getAdminFinanceDashboardData } from "@/app/data/car-finances.server";
import { FinanceDashboardClient } from "../../FinanceDashboardClient";
import { PageHeader } from "@/app/components/admin/ui";

export const instant = false;

export default async function AdminFinancesPage() {
  const result = await getAdminFinanceDashboardData();

  return (
    <>
      <PageHeader
        eyebrow="Pilotage · Privé"
        title="Finances"
        description="Suivi privé des ventes, des coûts et de la rentabilité du showroom."
      />
      {result.error || !result.data ? (
        <p role="alert" className="alert alert-bad">
          <CircleAlert aria-hidden="true" />
          Impossible de charger les données financières. Réessayez plus tard.
        </p>
      ) : (
        <FinanceDashboardClient cars={result.data.cars} finances={result.data.finances} />
      )}
    </>
  );
}
