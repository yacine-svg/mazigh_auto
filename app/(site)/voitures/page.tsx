import { Suspense } from "react";
import { getPublicVehicles } from "@/app/data/vehicles.server";
import { CarsCatalogClient } from "./CarsCatalogClient";
import { VehicleAvailabilityState } from "@/app/components/VehicleAvailabilityState";
import { LineReveal } from "@/app/components/site/Reveal";
import { SHOWROOM_CONFIG } from "@/lib/config";

export const metadata = {
  title: "Catalogue des Véhicules | MAZIGH AUTO - El Khroub, Constantine",
  description:
    "Découvrez notre stock de voitures disponibles à la vente et à l'échange chez Mazigh Auto (Showroom Kecherid Auto) à El Khroub, Constantine.",
};

export const instant = false;

export default async function VoituresCataloguePage() {
  const result = await getPublicVehicles();
  const count = result.data?.filter((c) => c.statut !== "vendue").length ?? 0;

  return (
    <>
      <section className="relative overflow-hidden border-b border-line pb-12 pt-36 md:pb-16 md:pt-44">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_90%_at_90%_0%,rgba(227,38,47,0.2),transparent_70%)]" aria-hidden="true" />
        <div className="wrap relative grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="eyebrow">{SHOWROOM_CONFIG.city} · Parc automobile</p>
            <LineReveal
              as="h1"
              lines={["Le", <>catalogue<span className="text-brand">.</span></>]}
              className="display mt-5 text-[clamp(3rem,10vw,9rem)]"
            />
          </div>
          <div className="max-w-sm md:text-right">
            <p className="display-condensed text-6xl">{String(count).padStart(2, "0")}</p>
            <p className="mt-2 text-sm text-fg-3">
              véhicules neufs et d&apos;occasion contrôlés. Écrivez-nous sur WhatsApp pour un essai ou une réservation.
            </p>
          </div>
        </div>
      </section>

      <section className="wrap py-10 md:py-14">
        {result.error ? (
          <VehicleAvailabilityState status="error" />
        ) : result.data.length === 0 ? (
          <VehicleAvailabilityState status="empty" />
        ) : (
          <Suspense fallback={<p className="text-fg-3">Chargement des véhicules...</p>}>
            <CarsCatalogClient initialCars={result.data} />
          </Suspense>
        )}
      </section>
    </>
  );
}
