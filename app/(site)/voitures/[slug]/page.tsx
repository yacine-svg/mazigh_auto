import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { VehicleGallery } from "@/app/components/VehicleGallery";
import { getPublicVehicleBySlug, getPublicVehicles } from "@/app/data/vehicles.server";
import { VehicleAvailabilityState } from "@/app/components/VehicleAvailabilityState";
import { formatPriceDZD, formatKm, STATUS_LABELS } from "@/app/data/cars";
import { CarCard } from "@/app/components/site/CarCard";
import { Reveal } from "@/app/components/site/Reveal";
import { SHOWROOM_CONFIG, buildCarWhatsAppUrl } from "@/lib/config";
import { ArrowLeft, Check, MapPin, MessageCircle, Phone, ShieldCheck } from "lucide-react";

type CarDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export const instant = false;

export async function generateMetadata({ params }: CarDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublicVehicleBySlug(slug);
  const car = result.data;

  if (!car) {
    return { title: "Véhicule | MAZIGH AUTO" };
  }

  const carName = `${car.marque} ${car.modele} ${car.annee}`;
  const priceFormatted = formatPriceDZD(car.prix);
  const coverImage = car.cover_image_url || car.images[0]?.url;

  return {
    title: `${carName} à ${priceFormatted} | MAZIGH AUTO`,
    description: car.description || `Découvrez ce véhicule ${carName} au Showroom Kecherid Auto, El Khroub, Constantine.`,
    openGraph: {
      title: `${carName} - ${priceFormatted} | MAZIGH AUTO`,
      description: car.description || `${car.carburant} • ${car.boite} • ${formatKm(car.kilometrage)}`,
      images: coverImage ? [{ url: coverImage }] : [],
    },
  };
}

export default async function CarDetailPage({ params }: CarDetailPageProps) {
  const { slug } = await params;
  const [result, allResult] = await Promise.all([
    getPublicVehicleBySlug(slug),
    getPublicVehicles(),
  ]);

  if (result.error || allResult.error) {
    return (
      <div className="wrap flex min-h-[80vh] items-center justify-center pt-24">
        <VehicleAvailabilityState status="error" />
      </div>
    );
  }

  if (!result.data) {
    if (allResult.data.length === 0) {
      return (
        <div className="wrap flex min-h-[80vh] items-center justify-center pt-24">
          <VehicleAvailabilityState status="empty" />
        </div>
      );
    }

    notFound();
  }

  const car = result.data;
  // Load related cars
  const relatedCars = allResult.data
    .filter((c) => c.id !== car.id && (c.marque === car.marque || c.type_carrosserie === car.type_carrosserie))
    .slice(0, 3);

  const badge = STATUS_LABELS[car.statut] || STATUS_LABELS.disponible;
  const whatsappUrl = buildCarWhatsAppUrl(car);

  const specs: Array<[string, string | undefined]> = [
    ["Marque", car.marque],
    ["Modèle", car.modele],
    ["Version / Finition", car.version],
    ["Année", String(car.annee)],
    ["Kilométrage", formatKm(car.kilometrage)],
    ["Carburant", car.carburant],
    ["Boîte de vitesses", car.boite],
    ["Motorisation", car.moteur],
    ["Cylindrée", car.cylindree],
    ["Puissance", car.puissance],
    ["Couleur", car.couleur],
    ["Carrosserie", car.type_carrosserie],
    ["État", car.etat],
    ["Papiers", car.papiers],
  ];

  return (
    <div className="pb-24 md:pb-0">
      <section className="wrap pt-28 md:pt-36">
        {/* Breadcrumbs */}
        <nav aria-label="Fil d'ariane" className="flex flex-wrap items-center gap-2 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-fg-3">
          <Link href="/voitures" className="inline-flex items-center gap-2 hover:text-fg">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Catalogue
          </Link>
          <span aria-hidden="true">/</span>
          <span>{car.marque}</span>
          <span aria-hidden="true">/</span>
          <span className="text-fg">{car.modele}</span>
        </nav>

        <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`pill ${badge.className}`}>{badge.label}</span>
              <span className="pill no-dot border-line-2 text-fg-3">{car.etat}</span>
              <span className="pill no-dot border-line-2 text-fg-3">Réf. {car.id.substring(0, 8)}</span>
            </div>
            <h1 className="display mt-5 text-[clamp(2.6rem,8vw,7.5rem)]">
              {car.marque} <span className="text-brand">{car.modele}</span>
            </h1>
            {car.version && <p className="mt-3 font-mono text-sm uppercase tracking-[0.16em] text-fg-2">{car.version}</p>}
          </div>
          <p className="display-condensed text-[clamp(2.6rem,6vw,4.8rem)] leading-none md:text-right">
            {formatPriceDZD(car.prix)}
          </p>
        </div>
      </section>

      <section className="wrap mt-10 grid items-start gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-8">
        <VehicleGallery images={car.images} vehicleName={`${car.marque} ${car.modele} ${car.annee}`} />

        <aside className="space-y-4 lg:sticky lg:top-28">
          <div className="rounded-[22px] border border-line bg-surface p-6">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-fg-3">Prix de vente</p>
                <p className="display-condensed mt-2 text-5xl leading-none">{formatPriceDZD(car.prix)}</p>
              </div>
              {car.negotiable && <span className="pill status-badge-disponible">Négociable</span>}
            </div>

            <dl className="mt-6 grid grid-cols-2 overflow-hidden rounded-2xl border border-line">
              {[
                ["Année", String(car.annee)],
                ["Kilométrage", formatKm(car.kilometrage)],
                ["Carburant", car.carburant],
                ["Boîte", car.boite],
              ].map(([k, v], i) => (
                <div key={k} className={`p-4 ${i % 2 ? "border-l border-line" : ""} ${i > 1 ? "border-t border-line" : ""}`}>
                  <dt className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-fg-3">{k}</dt>
                  <dd className="mt-1 font-semibold">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 grid gap-3">
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn btn-wa btn-lg btn-block">
                <MessageCircle aria-hidden="true" /> Réserver sur WhatsApp
              </a>
              <a href={`tel:${SHOWROOM_CONFIG.phoneRaw}`} className="btn btn-ghost btn-lg btn-block">
                <Phone aria-hidden="true" /> {SHOWROOM_CONFIG.phoneDisplay}
              </a>
            </div>
          </div>

          <div className="grid gap-3 rounded-[22px] border border-line bg-surface p-5 text-sm text-fg-2">
            <p className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
              Véhicule contrôlé, papiers vérifiés{car.papiers ? ` (${car.papiers})` : ""}.
            </p>
            <p className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
              Visible au showroom d&apos;El Khroub, Constantine, 6j/7.
            </p>
          </div>
        </aside>
      </section>

      <section className="wrap mt-16 grid gap-6 md:mt-24 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-8">
        <Reveal className="space-y-6">
          <div className="rounded-[22px] border border-line bg-surface">
            <h2 className="flex items-center justify-between border-b border-line px-6 py-5">
              <span className="display text-2xl">Fiche technique</span>
              <span className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-fg-3">Spécifications</span>
            </h2>
            <dl className="grid sm:grid-cols-2">
              {specs
                .filter(([, v]) => Boolean(v))
                .map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-4 border-b border-line px-6 py-4 sm:odd:border-r">
                    <dt className="font-mono text-[0.66rem] uppercase tracking-[0.14em] text-fg-3">{k}</dt>
                    <dd className="text-right font-medium">{v}</dd>
                  </div>
                ))}
            </dl>
          </div>

          <div className="rounded-[22px] border border-line bg-surface p-6">
            <h2 className="display text-2xl">État & remarques</h2>
            <p className="mt-4 whitespace-pre-line border-l-2 border-brand pl-5 leading-relaxed text-fg-2">
              {car.description || "Aucune remarque spécifique. Véhicule en excellent état général."}
            </p>
          </div>
        </Reveal>

        {car.options && car.options.length > 0 && (
          <Reveal className="self-start rounded-[22px] border border-line bg-surface p-6">
            <h2 className="flex items-baseline justify-between gap-4">
              <span className="display text-2xl">Équipements</span>
              <span className="mono text-xs text-fg-3">{car.options.length}</span>
            </h2>
            <ul className="mt-5 flex flex-wrap gap-2">
              {car.options.map((opt) => (
                <li key={opt} className="inline-flex items-center gap-1.5 rounded-full border border-line-2 px-3.5 py-1.5 text-sm text-fg-2">
                  <Check className="h-3.5 w-3.5 text-ok" aria-hidden="true" />
                  {opt}
                </li>
              ))}
            </ul>
          </Reveal>
        )}
      </section>

      {/* Related Cars */}
      {relatedCars.length > 0 && (
        <section className="wrap mt-20 pb-24 md:mt-28 md:pb-32">
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 className="display text-[clamp(2rem,4.5vw,3.6rem)]">
              Dans le même esprit<span className="text-brand">.</span>
            </h2>
            <Link href="/voitures" className="link-arrow hidden sm:inline-flex">
              Tout le catalogue
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {relatedCars.map((rc) => (
              <CarCard key={rc.id} car={rc} />
            ))}
          </div>
        </section>
      )}
      {relatedCars.length === 0 && <div className="pb-24 md:pb-32" />}

      {/* Sticky bottom bar on phones */}
      <aside
        aria-label="Action rapide contact"
        className="fixed inset-x-0 bottom-0 z-[65] flex items-center justify-between gap-3 border-t border-line bg-bg/90 px-4 py-3 backdrop-blur-xl md:hidden"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="min-w-0">
          <span className="block font-mono text-[0.58rem] uppercase tracking-[0.16em] text-fg-3">Prix de vente</span>
          <span className="display-condensed block truncate text-2xl leading-none">{formatPriceDZD(car.prix)}</span>
        </div>
        <div className="flex items-center gap-2">
          <a href={`tel:${SHOWROOM_CONFIG.phoneRaw}`} className="btn btn-ghost btn-icon" aria-label="Appeler le showroom">
            <Phone />
          </a>
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn btn-wa btn-sm">
            <MessageCircle aria-hidden="true" /> WhatsApp
          </a>
        </div>
      </aside>
    </div>
  );
}
