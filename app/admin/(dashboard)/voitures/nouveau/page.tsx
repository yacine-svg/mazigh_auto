import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireShowroomOwner } from "@/app/data/admin-auth.server";
import { CarFormClient } from "@/app/admin/CarFormClient";
import { PageHeader } from "@/app/components/admin/ui";

export const instant = false;

export default async function NewCarPage() {
  await requireShowroomOwner();

  return (
    <>
      <PageHeader
        eyebrow="Showroom · Nouveau"
        title="Ajouter un véhicule"
        description="Renseignez les détails, ajoutez les photos et publiez le véhicule sur le site."
        actions={
          <Link href="/admin/voitures" className="btn btn-ghost">
            <ArrowLeft aria-hidden="true" /> Inventaire
          </Link>
        }
      />
      <CarFormClient mode="create" />
    </>
  );
}
