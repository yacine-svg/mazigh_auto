import Link from "next/link";
import { Check, CircleAlert, Plus } from "lucide-react";
import { requireShowroomOwner } from "@/app/data/admin-auth.server";
import { getAdminVehicles } from "@/app/data/vehicles.server";
import { getAdminCarFinances } from "@/app/data/car-finances.server";
import { AdminCarsTableClient } from "@/app/admin/AdminCarsTableClient";
import { PageHeader } from "@/app/components/admin/ui";

type AdminCarsPageProps = {
  searchParams: Promise<{ created?: string; updated?: string }>;
};

export const instant = false;

export default async function AdminCarsPage({ searchParams }: AdminCarsPageProps) {
  await requireShowroomOwner();
  const { created, updated } = await searchParams;

  const [result, financeResult] = await Promise.all([getAdminVehicles(), getAdminCarFinances()]);
  const cars = result.data ?? [];
  const pageError = result.error || financeResult.error;

  return (
    <>
      <PageHeader
        eyebrow="Showroom · Inventaire"
        title="Véhicules"
        description="Gérez le parc, publiez les arrivages et mettez à jour les statuts en un clic."
        actions={
          <Link href="/admin/voitures/nouveau" className="btn btn-primary">
            <Plus aria-hidden="true" /> Nouveau véhicule
          </Link>
        }
      />

      {Boolean(created) && (
        <p className="alert alert-ok" role="status">
          <Check aria-hidden="true" /> Le véhicule a été ajouté au showroom avec succès.
        </p>
      )}
      {Boolean(updated) && (
        <p className="alert alert-info" role="status">
          <Check aria-hidden="true" /> Le véhicule a été mis à jour avec succès.
        </p>
      )}

      {pageError ? (
        <p className="alert alert-bad" role="alert">
          <CircleAlert aria-hidden="true" /> Impossible de charger les données. Réessayez plus tard.
        </p>
      ) : (
        <AdminCarsTableClient
          key={cars.map((c) => c.id + c.statut + c.is_featured).join(",")}
          initialCars={cars}
          initialFinances={financeResult.data ?? []}
        />
      )}
    </>
  );
}
