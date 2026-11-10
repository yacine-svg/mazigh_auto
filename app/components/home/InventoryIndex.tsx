"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { CarImage } from "@/app/components/CarImage";
import type { Car } from "@/app/data/cars";
import { formatKm, formatPriceDZD } from "@/app/data/cars";

/**
 * The stock as an index list. On desktop, hovering a row fills it with the
 * brand red and a photo of the car follows the pointer.
 */
export function InventoryIndex({ cars }: { cars: Car[] }) {
  const preview = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;
    setEnabled(true);

    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
    };
    const loop = () => {
      cur.x += (target.x - cur.x) * 0.14;
      cur.y += (target.y - cur.y) * 0.14;
      const tilt = Math.max(-8, Math.min(8, (target.x - cur.x) * 0.06));
      if (preview.current) {
        preview.current.style.transform = `translate3d(${cur.x + 30}px, ${cur.y - 120}px, 0) rotate(${tilt}deg)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  if (cars.length === 0) return null;

  return (
    <>
      <ul className="index-list" onPointerLeave={() => setActive(null)}>
        {cars.map((car, i) => {
          const href = `/voitures/${car.slug || car.id}`;
          return (
            <li key={car.id} className="relative isolate">
              <Link
                href={href}
                className="index-row"
                onPointerEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
              >
                <span className="mono text-xs text-fg-3">{String(i + 1).padStart(2, "0")}</span>
                <span className="min-w-0">
                  <span className="display block truncate text-[clamp(1.4rem,2.6vw,2.4rem)] leading-none">
                    {car.marque} {car.modele}
                  </span>
                  <span className="mt-1.5 block font-mono text-[0.68rem] uppercase tracking-[0.14em] text-fg-3 min-[900px]:hidden">
                    {car.annee} · {formatKm(car.kilometrage)} · {formatPriceDZD(car.prix)}
                  </span>
                </span>
                <span className="hidden font-mono text-xs uppercase tracking-[0.14em] text-fg-3 min-[900px]:block">
                  {car.annee} · {formatKm(car.kilometrage)}
                </span>
                <span className="hidden font-mono text-xs uppercase tracking-[0.14em] text-fg-3 min-[900px]:block">
                  {car.carburant} · {car.boite}
                </span>
                <span className="flex items-center justify-end gap-4">
                  <span className="display-condensed hidden text-2xl min-[900px]:inline">{formatPriceDZD(car.prix)}</span>
                  <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {enabled && (
        <div ref={preview} className={`index-preview ${active !== null ? "is-on" : ""}`} aria-hidden="true">
          {cars.map((car, i) => (
            <div
              key={car.id}
              className="absolute inset-0 transition-[opacity,transform] duration-500 ease-[var(--ease-premium)]"
              style={{ opacity: active === i ? 1 : 0, transform: active === i ? "scale(1)" : "scale(1.12)" }}
            >
              <CarImage
                src={car.cover_image_url || car.images[0]?.url}
                alt=""
                fill
                sizes="352px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
