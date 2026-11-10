"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import type { Car } from "@/app/data/cars";
import { CarCard } from "@/app/components/site/CarCard";
import { LineReveal } from "@/app/components/site/Reveal";
import { gsap, useGSAP } from "@/lib/gsap";

/** Featured cars: a pinned horizontal rail on desktop, a swipe row on phones. */
export function FeaturedRail({ cars, total }: { cars: Car[]; total: number }) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const el = track.current;
        if (!el) return;
        const distance = () => Math.max(0, el.scrollWidth - window.innerWidth);
        if (distance() < 40) return;
        gsap.to(el, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: section.current,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.9,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (bar.current) bar.current.style.transform = `scaleX(${self.progress})`;
            },
          },
        });
      });
      return () => mm.revert();
    },
    { scope: section },
  );

  return (
    <section
      ref={section}
      className="relative overflow-hidden border-y border-line bg-surface/40 py-20 lg:flex lg:h-screen lg:flex-col lg:justify-center lg:py-0"
      aria-labelledby="featured-title"
    >
      <div className="wrap flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">La sélection · {total} véhicules</p>
          <LineReveal
            lines={["Prêtes à", <>prendre la route<span className="text-brand">.</span></>]}
            className="display mt-5 text-[clamp(2.4rem,6vw,5.5rem)]"
          />
        </div>
        <Link href="/voitures" className="btn btn-ghost self-start md:self-end">
          Tout le stock <ArrowRight aria-hidden="true" />
        </Link>
      </div>

      <div
        ref={track}
        className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto px-[max(1.25rem,3.5vw)] pb-2 lg:mt-14 lg:snap-none lg:overflow-visible lg:will-change-transform"
        tabIndex={0}
        aria-label="Voitures en vedette, faites défiler horizontalement"
      >
        {cars.map((car, i) => (
          <CarCard
            key={car.id}
            car={car}
            priority={i === 0}
            className="w-[84vw] shrink-0 snap-start sm:w-[58vw] lg:w-[min(30vw,460px)]"
            sizes="(min-width: 1024px) 30vw, 84vw"
          />
        ))}
        <Link
          href="/voitures"
          data-cursor="Stock"
          className="group flex w-[64vw] shrink-0 snap-start flex-col justify-end rounded-[18px] border border-dashed border-line-2 p-8 transition-colors hover:border-brand sm:w-[40vw] lg:w-[min(22vw,340px)]"
        >
          <span className="display text-4xl">Voir tout le stock</span>
          <span className="mt-6 grid h-12 w-12 place-items-center rounded-full border border-line-2 transition-colors group-hover:border-brand group-hover:bg-brand">
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </span>
        </Link>
        <span className="w-px shrink-0" aria-hidden="true" />
      </div>

      <div className="wrap mt-10 hidden lg:block" aria-hidden="true">
        <div className="h-px w-full bg-line">
          <span ref={bar} className="block h-px origin-left scale-x-0 bg-brand" />
        </div>
      </div>
    </section>
  );
}
