import Link from "next/link";
import { ArrowUpRight, Camera } from "lucide-react";
import { CarImage } from "@/app/components/CarImage";
import type { Car } from "@/app/data/cars";
import { STATUS_LABELS, formatKm, formatPriceDZD } from "@/app/data/cars";

type CarCardProps = {
  car: Car;
  priority?: boolean;
  className?: string;
  sizes?: string;
};

export function CarCard({ car, priority = false, className = "", sizes }: CarCardProps) {
  const href = `/voitures/${car.slug || car.id}`;
  const cover = car.cover_image_url || car.images[0]?.url;
  const badge = STATUS_LABELS[car.statut] || STATUS_LABELS.disponible;

  return (
    <article className={`car-card group ${className}`}>
      <div className="car-card-media">
        <CarImage
          src={cover}
          alt={`${car.marque} ${car.modele} ${car.annee}`}
          fill
          priority={priority}
          sizes={sizes ?? "(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 92vw"}
          className="object-cover"
        />
        <div className="absolute left-4 top-4 z-[1] flex gap-2">
          <span className={`pill ${badge.className}`}>{badge.label}</span>
        </div>
        <div className="absolute right-4 top-4 z-[1] flex gap-2">
          <span className="pill pill-glass no-dot">{car.annee}</span>
          {car.images.length > 1 && (
            <span className="pill pill-glass no-dot">
              <Camera className="h-3 w-3" aria-hidden="true" /> {car.images.length}
            </span>
          )}
        </div>
        <span className="car-card-line" aria-hidden="true" />
      </div>

      <div className="flex flex-1 flex-col gap-5 p-5 md:p-6">
        <div>
          <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-fg-3">
            {car.marque} {car.version ? `· ${car.version}` : ""}
          </p>
          <h3 className="display mt-2 text-[1.7rem] leading-[0.95]">
            <Link
              href={href}
              data-cursor="Voir"
              className="after:absolute after:inset-0 after:z-[2] after:content-[''] focus-visible:outline-none"
            >
              {car.marque} {car.modele}
            </Link>
          </h3>
        </div>

        <dl className="spec-row">
          <div>
            <dt>Kilométrage</dt>
            <dd><b>{formatKm(car.kilometrage)}</b></dd>
          </div>
          <div>
            <dt>Énergie</dt>
            <dd><b>{car.carburant}</b></dd>
          </div>
          <div>
            <dt>Boîte</dt>
            <dd><b>{car.boite === "Automatique" ? "Auto" : "Manuelle"}</b></dd>
          </div>
        </dl>

        <div className="mt-auto flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-fg-3">Prix</p>
            <p className="display-condensed mt-1 text-[2.1rem] leading-none">{formatPriceDZD(car.prix)}</p>
            {car.negotiable && <p className="mt-1 font-mono text-[0.64rem] text-fg-3">Négociable</p>}
          </div>
          <span className="car-card-arrow" aria-hidden="true">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </article>
  );
}
