"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { gsap, useGSAP, MOTION_OK } from "@/lib/gsap";
import { ShaderBackground } from "@/app/components/site/ShaderBackground";
import { Magnetic } from "@/app/components/site/Magnetic";
import { CarImage } from "@/app/components/CarImage";
import type { Car } from "@/app/data/cars";
import { formatKm, formatPriceDZD } from "@/app/data/cars";
import { SHOWROOM_CONFIG } from "@/lib/config";

type HeroProps = {
  spotlight: Car | null;
  stockCount: number;
};

export function Hero({ spotlight, stockCount }: HeroProps) {
  const root = useRef<HTMLElement>(null);
  const bg = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
        tl.from(".hero-line > span", { yPercent: 115, duration: 1.5, stagger: 0.08, delay: 0.1 })
          .from(".hero-fade", { y: 24, autoAlpha: 0, duration: 1.1, stagger: 0.08 }, "-=1.05")
          .from(".hero-card", { y: 50, autoAlpha: 0, duration: 1.3 }, "-=1");

        // Parallax: background drifts, the title lifts away as you scroll.
        gsap.to(bg.current, {
          yPercent: 18,
          scale: 1.08,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
        });
        gsap.to(".hero-title", {
          yPercent: -18,
          autoAlpha: 0.15,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  const spotHref = spotlight ? `/voitures/${spotlight.slug || spotlight.id}` : "/voitures";
  const spotCover = spotlight ? spotlight.cover_image_url || spotlight.images[0]?.url : null;

  return (
    <section ref={root} className="hero" aria-labelledby="hero-title">
      <div ref={bg} className="hero-bg will-change-transform">
        <ShaderBackground preset="hero" />
      </div>
      <div className="hero-shade" aria-hidden="true" />

      <div className="wrap relative flex min-h-[100svh] flex-col justify-end pb-10 pt-28 md:pb-12">
        <p className="hero-fade eyebrow text-fg-2">
          {SHOWROOM_CONFIG.city} · Algérie · {SHOWROOM_CONFIG.subtitle}
        </p>

        <h1 id="hero-title" className="hero-title display mt-6">
          <span className="hero-line line-mask"><span>Achat.</span></span>
          <span className="hero-line line-mask"><span>Vente<span className="text-brand">.</span></span></span>
          <span className="hero-line line-mask"><span className="outline-text">Échange.</span></span>
        </h1>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-xl">
            <p className="hero-fade text-base leading-relaxed text-fg-2 md:text-lg">
              Bienvenue chez <strong className="font-semibold text-fg">Mazigh Auto</strong>. Des voitures neuves et
              d&apos;occasion contrôlées, papiers en règle, disponibles tout de suite à El Khroub.
            </p>
            <div className="hero-fade mt-8 flex flex-wrap gap-3">
              <Magnetic>
                <Link href="/voitures" className="btn btn-primary btn-lg">
                  Voir le catalogue <ArrowRight aria-hidden="true" />
                </Link>
              </Magnetic>
              <Magnetic>
                <Link href="/vendre-echanger" className="btn btn-ghost btn-lg">
                  Vendre ma voiture
                </Link>
              </Magnetic>
            </div>

            <dl className="hero-fade mt-10 grid max-w-lg grid-cols-3 border-t border-line pt-5">
              <div>
                <dt className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-fg-3">Au parc</dt>
                <dd className="display-condensed mt-1 text-4xl">{stockCount}</dd>
              </div>
              <div className="border-l border-line pl-5">
                <dt className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-fg-3">Papiers</dt>
                <dd className="display-condensed mt-1 text-4xl">100%</dd>
              </div>
              <div className="border-l border-line pl-5">
                <dt className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-fg-3">WhatsApp</dt>
                <dd className="display-condensed mt-1 text-4xl">24/7</dd>
              </div>
            </dl>
          </div>

          {spotlight && (
            <Link href={spotHref} className="hero-card spot-card group block lg:w-[22rem]" data-cursor="Voir">
              <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-surface-2">
                <CarImage
                  src={spotCover}
                  alt={`${spotlight.marque} ${spotlight.modele}`}
                  fill
                  priority
                  sizes="368px"
                  className="object-cover transition-transform duration-[1400ms] ease-[var(--ease-premium)] group-hover:scale-105"
                />
                <span className="pill pill-glass no-dot absolute left-3 top-3">Véhicule vedette</span>
              </div>
              <div className="mt-4 flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {spotlight.marque} {spotlight.modele}
                  </p>
                  <p className="mt-0.5 font-mono text-[0.68rem] text-fg-3">
                    {spotlight.annee} · {formatKm(spotlight.kilometrage)} · {spotlight.carburant}
                  </p>
                </div>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-white transition-transform duration-500 group-hover:-rotate-45">
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
              <p className="display-condensed mt-3 text-3xl">{formatPriceDZD(spotlight.prix)}</p>
            </Link>
          )}
        </div>

      </div>
    </section>
  );
}
