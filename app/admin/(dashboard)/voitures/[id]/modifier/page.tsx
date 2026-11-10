import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CircleAlert, ExternalLink } from "lucide-react";
import { requireShowroomOwner } from "@/app/data/admin-auth.server";
import { getCarById } from "@/app/data/vehicles.server";
import { getAdminCarFinance } from "@/app/data/car-finances.server";
import { CarFormClient } from "@/app/admin/CarFormClient";
import { PageHeader } from "@/app/components/admin/ui";
import { STATUS_LABELS } from "@/app/data/cars";

type EditCarPageProps = {
  params: Promise<{ id: string }>;
};

export const instant = false;

export default async function EditCarPage({ params }: EditCarPageProps) {
  await requireShowroomOwner();
  const { id } = await params;

  const [result, financeResult] = await Promise.all([getCarById(id), getAdminCarFinance(id)]);
  const car = result.data;

  if (!car) {
    notFound();
  }

  if (financeResult.error) {
    return (
      <p className="alert alert-bad" role="alert">
        <CircleAlert aria-hidden="true" />
        Impossible de charger les informations privées du véhicule. Réessayez plus tard.
      </p>
    );
  }

  const badge = STATUS_LABELS[car.statut];

  return (
    <>
      <PageHeader
        eyebrow="Showroom · Modifier"
        title={
          <span className="flex flex-wrap items-center gap-3">
            {car.marque} {car.modele} <span className="text-fg-3">{car.annee}</span>
            <span className={`pill ${badge.className}`}>{badge.label}</span>
          </span>
        }
        description="Mettez à jour les caractéristiques, le prix, les photos ou le statut."
        actions={
          <>
            <Link href={`/voitures/${car.slug || car.id}`} target="_blank" className="btn btn-ghost">
              <ExternalLink aria-hidden="true" /> Fiche publique
            </Link>
            <Link href="/admin/voitures" className="btn btn-ghost">
              <ArrowLeft aria-hidden="true" /> Inventaire
            </Link>
          </>
        }
      />
      <CarFormClient mode="edit" initialCar={car} initialFinance={financeResult.data} />
    </>
  );
}
