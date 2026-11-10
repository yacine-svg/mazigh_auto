import Link from "next/link";
import { CircleAlert, Plus } from "lucide-react";
import { requireShowroomOwner } from "@/app/data/admin-auth.server";
import { getAdminVehicles } from "@/app/data/vehicles.server";
import { getAdminCarFinances } from "@/app/data/car-finances.server";
import { PageHeader } from "@/app/components/admin/ui";
import { AdminOverviewClient } from "@/app/components/admin/AdminOverviewClient";

export const instant = false;

export default async function AdminOverviewPage() {
  const owner = await requireShowroomOwner();
  const [result, financeResult] = await Promise.all([getAdminVehicles(), getAdminCarFinances()]);
  const error = result.error || financeResult.error;
  const name = owner.email?.split("@")[0];

  return (
    <>
      <PageHeader
        eyebrow="Mazigh Auto · Back-office"
        title={name ? `Bonjour, ${name}` : "Tableau de bord"}
        description="Vue d'ensemble du showroom : stock, ventes et véhicules à surveiller."
        actions={
          <>
            <Link href="/admin/voitures" className="btn btn-ghost">
              Gérer le stock
            </Link>
            <Link href="/admin/voitures/nouveau" className="btn btn-primary">
              <Plus aria-hidden="true" /> Nouveau véhicule
            </Link>
          </>
        }
      />

      {error ? (
        <p className="alert alert-bad" role="alert">
          <CircleAlert aria-hidden="true" />
          Impossible de charger les données du tableau de bord. Réessayez plus tard.
        </p>
      ) : (
        <AdminOverviewClient cars={result.data ?? []} finances={financeResult.data ?? []} />
      )}
    </>
  );
}
