import { ArrowUpRight, Clock, MapPin, MessageCircle, Phone, Video } from "lucide-react";
import { LineReveal, Reveal } from "@/app/components/site/Reveal";
import { Magnetic } from "@/app/components/site/Magnetic";
import { SHOWROOM_CONFIG, buildGenericWhatsAppUrl } from "@/lib/config";

export const metadata = {
  title: "Contact & Localisation | MAZIGH AUTO - El Khroub, Constantine",
  description:
    "Visitez notre showroom automobile Mazigh Auto à El Khroub, Constantine. Téléphone, WhatsApp, plan d'accès Google Maps et réseaux sociaux.",
};

const channels = [
  {
    icon: Phone,
    label: "Téléphone direct",
    value: SHOWROOM_CONFIG.phoneDisplay,
    note: "Appel en Algérie",
    href: `tel:${SHOWROOM_CONFIG.phoneRaw}`,
    external: false,
    mono: true,
  },
  {
    icon: MessageCircle,
    label: "WhatsApp showroom",
    value: "Écrire au responsable",
    note: "Réponse rapide",
    href: buildGenericWhatsAppUrl(),
    external: true,
    mono: false,
  },
  {
    icon: MapPin,
    label: "Adresse",
    value: SHOWROOM_CONFIG.fullAddress,
    note: "Itinéraire Google Maps",
    href: SHOWROOM_CONFIG.googleMapsUrl,
    external: true,
    mono: false,
  },
  {
    icon: Video,
    label: "TikTok",
    value: `@${SHOWROOM_CONFIG.tiktokName}`,
    note: "Arrivages en vidéo",
    href: SHOWROOM_CONFIG.tiktokUrl,
    external: true,
    mono: false,
  },
] as const;

export default function ContactPage() {
  return (
    <>
      <section className="relative overflow-hidden pb-12 pt-36 md:pb-20 md:pt-44">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_90%_at_10%_0%,rgba(227,38,47,0.18),transparent_70%)]" aria-hidden="true" />
        <div className="wrap relative grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <div>
            <p className="eyebrow">{SHOWROOM_CONFIG.city}</p>
            <LineReveal
              as="h1"
              lines={["Parlons", <>voiture<span className="text-brand">.</span></>]}
              className="display mt-5 text-[clamp(3rem,10vw,9rem)]"
            />
          </div>
          <div className="space-y-6">
            <p className="max-w-md text-fg-2">
              Une question sur un modèle, un essai, une estimation ? L&apos;équipe est disponible 6 jours sur 7, au
              showroom comme sur WhatsApp.
            </p>
            <Magnetic>
              <a href={buildGenericWhatsAppUrl()} target="_blank" rel="noreferrer" className="btn btn-wa btn-lg">
                <MessageCircle aria-hidden="true" /> Ouvrir WhatsApp
              </a>
            </Magnetic>
          </div>
        </div>
      </section>

      <section className="wrap pb-24 md:pb-32">
        <Reveal stagger={0.08} className="grid gap-px overflow-hidden rounded-[22px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {channels.map((c) => {
            const Icon = c.icon;
            return (
              <a
                key={c.label}
                data-reveal
                href={c.href}
                target={c.external ? "_blank" : undefined}
                rel={c.external ? "noreferrer" : undefined}
                className="group relative flex min-h-56 flex-col justify-between gap-8 bg-surface p-6 transition-colors duration-500 hover:bg-surface-2"
              >
                <span className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-full border border-line-2 text-brand transition-colors duration-500 group-hover:border-brand group-hover:bg-brand group-hover:text-white">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <ArrowUpRight className="h-5 w-5 text-fg-3 transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-fg" aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-mono text-[0.62rem] uppercase tracking-[0.18em] text-fg-3">{c.label}</span>
                  <span className={`mt-2 block text-lg font-semibold leading-snug ${c.mono ? "mono" : ""}`}>{c.value}</span>
                  <span className="mt-1 block text-sm text-fg-3">{c.note}</span>
                </span>
              </a>
            );
          })}
        </Reveal>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div className="rounded-[22px] border border-line bg-surface p-6">
            <h2 className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-brand" aria-hidden="true" />
              <span className="display text-xl">Disponibilités</span>
            </h2>
            <dl className="mt-5 divide-y divide-line text-sm">
              <div className="flex justify-between py-3">
                <dt className="text-fg-3">Showroom</dt>
                <dd className="mono">6 jours sur 7</dd>
              </div>
              <div className="flex justify-between py-3">
                <dt className="text-fg-3">WhatsApp</dt>
                <dd className="mono">24/7</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-fg-3">Appelez avant de passer pour vérifier qu&apos;un véhicule est toujours disponible.</p>
          </div>

          <div className="map-frame min-h-[24rem]" data-lenis-prevent>
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
