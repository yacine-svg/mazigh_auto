import Link from "next/link";
import { ArrowRight, ArrowUpRight, MapPin, MessageCircle, Phone } from "lucide-react";
import { getPublicVehicles } from "@/app/data/vehicles.server";
import { SHOWROOM_CONFIG, buildGenericWhatsAppUrl } from "@/lib/config";
import { VehicleAvailabilityState } from "@/app/components/VehicleAvailabilityState";
import { Hero } from "@/app/components/home/Hero";
import { FeaturedRail } from "@/app/components/home/FeaturedRail";
import { InventoryIndex } from "@/app/components/home/InventoryIndex";
import { Marquee } from "@/app/components/site/Marquee";
import { LineReveal, Reveal } from "@/app/components/site/Reveal";
import { Magnetic } from "@/app/components/site/Magnetic";
import { UnicornScene } from "@/app/components/site/UnicornScene";

const services = [
  {
    title: "Achat, vente & reprise",
    text: "Nous rachetons, vendons et échangeons vos véhicules au juste prix du marché, avec une estimation claire et rapide.",
  },
  {
    title: "Véhicules vérifiés",
    text: "Chaque voiture du showroom passe un contrôle de la mécanique, de la carrosserie et des papiers avant d'être exposée.",
  },
  {
    title: "Transparence totale",
    text: "Papiers en règle (carte grise, safia), historique clair et accompagnement jusqu'à la remise des clés.",
  },
] as const;

const FALLBACK_BRANDS = ["Volkswagen", "Renault", "Hyundai", "Peugeot", "Toyota", "Kia", "Seat", "Skoda"];

export const instant = false;

export default async function Home() {
  const result = await getPublicVehicles();
  const cars = result.data ?? [];
  const available = cars.filter((c) => c.statut !== "vendue");
  const featured = cars.filter((c) => c.is_featured);
  const railCars = (featured.length >= 3 ? featured : [...featured, ...cars.filter((c) => !c.is_featured)]).slice(0, 6);
  const spotlight = featured[0] ?? cars[0] ?? null;

  const brands = Array.from(new Set(cars.map((c) => c.marque).filter(Boolean)));
  const marqueeItems = brands.length >= 4 ? brands : Array.from(new Set([...brands, ...FALLBACK_BRANDS]));

  return (
    <>
      <Hero spotlight={spotlight} stockCount={available.length} />

      {/* Brands */}
      <section aria-label="Marques au showroom" className="border-t border-line py-7">
        <Marquee speed={45}>
          {marqueeItems.map((brand) => (
            <span key={brand} className="flex items-center gap-12">
              <span className="display text-[clamp(1.8rem,4vw,3.2rem)] text-fg/90">{brand}</span>
              <span className="h-2 w-2 rotate-45 bg-brand" aria-hidden="true" />
            </span>
          ))}
        </Marquee>
      </section>

      {result.error ? (
        <section className="wrap py-24">
          <VehicleAvailabilityState status="error" />
        </section>
      ) : cars.length === 0 ? (
        <section className="wrap py-24">
          <VehicleAvailabilityState status="empty" />
        </section>
      ) : (
        <>
          <FeaturedRail cars={railCars} total={available.length} />

          {/* Index of the stock */}
          <section className="py-24 md:py-32" aria-labelledby="index-title">
            <div className="wrap">
              <div className="mb-12 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
                <div>
                  <p className="eyebrow">Le parc · arrivages récents</p>
                  <LineReveal
                    as="h2"
                    lines={["Tout le stock,", <>en un coup d&apos;œil<span className="text-brand">.</span></>]}
                    className="display mt-5 text-[clamp(2.2rem,5.5vw,5rem)]"
                  />
                </div>
                <Link href="/voitures" className="link-arrow self-start md:self-end">
                  Filtrer le catalogue <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
              <span id="index-title" className="sr-only">Liste des véhicules</span>
              <InventoryIndex cars={cars.slice(0, 8)} />
            </div>
          </section>
        </>
      )}

      {/* Services */}
      <section className="border-t border-line py-24 md:py-32" aria-labelledby="services-title">
        <div className="wrap grid gap-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <p className="eyebrow">Pourquoi Mazigh Auto</p>
            <LineReveal
              lines={["Le spécialiste", "de la voiture", <>à El Khroub<span className="text-brand">.</span></>]}
              className="display mt-5 text-[clamp(2.2rem,5vw,4.6rem)]"
            />
            <p id="services-title" className="mt-6 max-w-md text-fg-3">
              Un showroom familial à Constantine, connu pour sa franchise et ses voitures prêtes à rouler.
            </p>
          </div>

          <Reveal stagger={0.12} className="grid gap-4">
            {services.map((s, i) => (
              <article
                key={s.title}
                data-reveal
                className="group relative overflow-hidden rounded-[20px] border border-line bg-surface p-7 transition-colors duration-500 hover:border-line-2 md:p-9"
              >
                <span className="pointer-events-none absolute -right-6 -top-10 display-condensed text-[9rem] text-fg/[0.04] transition-colors duration-700 group-hover:text-brand/15" aria-hidden="true">
                  0{i + 1}
                </span>
                <span className="mono text-xs text-brand">0{i + 1}</span>
                <h3 className="display mt-4 text-2xl md:text-3xl">{s.title}</h3>
                <p className="mt-3 max-w-lg text-fg-3">{s.text}</p>
              </article>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Sell / trade-in CTA */}
      <section className="wrap pb-24 md:pb-32" aria-labelledby="cta-title">
        <div className="relative isolate overflow-hidden rounded-[28px] border border-line">
          <UnicornScene className="-z-10" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-bg/85 via-bg/50 to-bg/10" aria-hidden="true" />
          <div className="grid gap-10 px-6 py-16 md:grid-cols-[1.3fr_1fr] md:items-end md:px-14 md:py-24">
            <div>
              <p className="eyebrow text-fg-2">Service rapide · réponse le jour même</p>
              <LineReveal
                lines={["Votre voiture", <>vaut plus<span className="text-brand">.</span></>]}
                className="display mt-5 text-[clamp(2.6rem,7vw,6.5rem)]"
              />
              <p id="cta-title" className="mt-6 max-w-lg text-fg-2">
                Rachat cash ou échange contre un véhicule du showroom. Envoyez les infos de votre voiture,
                on vous répond sur WhatsApp avec une offre concrète.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:flex-col md:items-end">
              <Magnetic>
                <Link href="/vendre-echanger" className="btn btn-primary btn-lg">
                  Estimer mon véhicule <ArrowRight aria-hidden="true" />
                </Link>
              </Magnetic>
              <Magnetic>
                <a
                  href={buildGenericWhatsAppUrl(
                    "Bonjour MAZIGH AUTO, je souhaite avoir une estimation pour vendre/échanger mon véhicule.",
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-wa btn-lg"
                >
                  <MessageCircle aria-hidden="true" /> Discuter sur WhatsApp
                </a>
              </Magnetic>
            </div>
          </div>
        </div>
      </section>

      {/* Visit */}
      <section id="contact" className="border-t border-line py-24 md:py-32" aria-labelledby="visit-title">
        <div className="wrap grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-stretch">
          <div className="flex flex-col">
            <p className="eyebrow">Localisation & contact</p>
            <LineReveal
              lines={["Passez nous voir", <>au showroom<span className="text-brand">.</span></>]}
              className="display mt-5 text-[clamp(2.2rem,5vw,4.4rem)]"
            />
            <p id="visit-title" className="mt-6 max-w-md text-fg-3">
              L&apos;équipe vous accueille à El Khroub pour un essai, une estimation ou simplement un conseil.
            </p>

            <ul className="mt-10 divide-y divide-line border-y border-line">
              <li>
                <a href={`tel:${SHOWROOM_CONFIG.phoneRaw}`} className="group flex items-center justify-between gap-4 py-5">
                  <span className="flex items-center gap-4">
                    <Phone className="h-4 w-4 text-brand" aria-hidden="true" />
                    <span>
                      <span className="block font-mono text-[0.62rem] uppercase tracking-[0.18em] text-fg-3">Téléphone & WhatsApp</span>
                      <span className="mono mt-1 block text-lg">{SHOWROOM_CONFIG.phoneDisplay}</span>
                    </span>
                  </span>
                  <ArrowUpRight className="h-5 w-5 text-fg-3 transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-brand" aria-hidden="true" />
                </a>
              </li>
              <li>
                <a href={SHOWROOM_CONFIG.googleMapsUrl} target="_blank" rel="noreferrer" className="group flex items-center justify-between gap-4 py-5">
                  <span className="flex items-center gap-4">
                    <MapPin className="h-4 w-4 text-brand" aria-hidden="true" />
                    <span>
                      <span className="block font-mono text-[0.62rem] uppercase tracking-[0.18em] text-fg-3">Adresse</span>
                      <span className="mt-1 block">{SHOWROOM_CONFIG.fullAddress}</span>
                    </span>
                  </span>
                  <ArrowUpRight className="h-5 w-5 text-fg-3 transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-brand" aria-hidden="true" />
                </a>
              </li>
              <li>
                <a href={SHOWROOM_CONFIG.tiktokUrl} target="_blank" rel="noreferrer" className="group flex items-center justify-between gap-4 py-5">
                  <span>
                    <span className="block font-mono text-[0.62rem] uppercase tracking-[0.18em] text-fg-3">TikTok</span>
                    <span className="mt-1 block">@{SHOWROOM_CONFIG.tiktokName}</span>
                  </span>
                  <ArrowUpRight className="h-5 w-5 text-fg-3 transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-brand" aria-hidden="true" />
                </a>
              </li>
            </ul>
          </div>

          <div className="map-frame min-h-[22rem]" data-lenis-prevent>
            <iframe
              title="Google Maps Mazigh Auto El Khroub"
              src={SHOWROOM_CONFIG.googleMapsEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0"
            />
          </div>
        </div>
      </section>
    </>
  );
}
