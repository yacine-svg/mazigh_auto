import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Wordmark } from "@/app/components/Wordmark";
import { SITE_LINKS } from "./nav";
import { SHOWROOM_CONFIG, buildGenericWhatsAppUrl } from "@/lib/config";

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-line bg-bg pt-16 md:pt-24">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[60%] bg-[radial-gradient(60%_80%_at_50%_100%,rgba(227,38,47,0.16),transparent_70%)]" aria-hidden="true" />
      <div className="wrap relative">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="space-y-5">
            <Wordmark />
            <p className="max-w-sm text-sm leading-relaxed text-fg-3">
              {SHOWROOM_CONFIG.tagline}. Véhicules contrôlés, papiers en règle et réponse rapide sur WhatsApp.
            </p>
            <a href={buildGenericWhatsAppUrl()} target="_blank" rel="noreferrer" className="link-arrow">
              Écrire sur WhatsApp <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>

          <nav aria-label="Navigation pied de page">
            <p className="eyebrow plain mb-5">Navigation</p>
            <ul className="space-y-3 text-sm">
              {SITE_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-fg-2 transition-colors hover:text-brand-2">
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/admin" className="text-fg-3 transition-colors hover:text-fg">
                  Espace admin
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <p className="eyebrow plain mb-5">Contact</p>
            <ul className="space-y-3 text-sm text-fg-2">
              <li>
                <a href={`tel:${SHOWROOM_CONFIG.phoneRaw}`} className="mono text-base text-fg hover:text-brand-2">
                  {SHOWROOM_CONFIG.phoneDisplay}
                </a>
              </li>
              <li>
                <a href={SHOWROOM_CONFIG.tiktokUrl} target="_blank" rel="noreferrer" className="hover:text-brand-2">
                  TikTok · @{SHOWROOM_CONFIG.tiktokName}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="eyebrow plain mb-5">Showroom</p>
            <p className="text-sm leading-relaxed text-fg-2">{SHOWROOM_CONFIG.fullAddress}</p>
            <a href={SHOWROOM_CONFIG.googleMapsUrl} target="_blank" rel="noreferrer" className="link-arrow mt-4">
              Itinéraire <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-2 border-t border-line py-6 font-mono text-[0.66rem] uppercase tracking-[0.18em] text-fg-3 sm:flex-row sm:items-center sm:justify-between">
          <span>© {SHOWROOM_CONFIG.copyrightYear} Mazigh Auto · {SHOWROOM_CONFIG.subtitle}</span>
          <span>{SHOWROOM_CONFIG.city} · Algérie</span>
        </div>
      </div>

      <p className="footer-word display relative select-none whitespace-nowrap text-center outline-text" aria-hidden="true">
        Mazigh
      </p>
    </footer>
  );
}
