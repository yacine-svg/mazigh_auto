import { Suspense, type ReactNode } from "react";
import { requireShowroomOwner } from "@/app/data/admin-auth.server";
import { getAdminVehicles } from "@/app/data/vehicles.server";
import { AdminShell, type AdminSearchItem } from "@/app/components/admin/AdminShell";
import { formatPriceDZD } from "@/app/data/cars";
import { stockDays } from "@/app/components/admin/metrics";

export const instant = false;

type ProtectedAdminLayoutProps = {
  children: ReactNode;
};

async function OwnerDashboard({ children }: ProtectedAdminLayoutProps) {
  const owner = await requireShowroomOwner();
  const result = await getAdminVehicles();
  const cars = result.data ?? [];

  const searchIndex: AdminSearchItem[] = cars.map((car) => ({
    id: car.id,
    label: `${car.marque} ${car.modele}${car.version ? ` ${car.version}` : ""}`,
    sub: `${car.annee} · ${formatPriceDZD(car.prix)} · ${car.statut}`,
    href: `/admin/voitures/${car.id}/modifier`,
    image: car.cover_image_url || car.images[0]?.url || null,
    keywords: [car.marque, car.modele, car.version, car.couleur, car.slug, String(car.annee)]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("fr"),
  }));

  const unsold = cars.filter((c) => c.statut === "disponible" || c.statut === "reservee");
  const counts = {
    stock: unsold.length,
    reserved: cars.filter((c) => c.statut === "reservee").length,
    drafts: cars.filter((c) => c.statut === "brouillon").length,
    aging: unsold.filter((c) => (stockDays(c) ?? 0) > 60).length,
  };

  return (
    <AdminShell email={owner.email} searchIndex={searchIndex} counts={counts}>
      {children}
    </AdminShell>
  );
}

function ShellFallback() {
  return (
    <div className="adm grid min-h-screen place-items-center">
      <p className="flex items-center gap-3 text-sm text-fg-3" role="status">
        <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />
        Vérification de l&apos;accès…
      </p>
    </div>
  );
}

export default function ProtectedAdminLayout({ children }: ProtectedAdminLayoutProps) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <OwnerDashboard>{children}</OwnerDashboard>
    </Suspense>
  );
}
