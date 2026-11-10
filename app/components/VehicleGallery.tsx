"use client";

import { CarImage } from "./CarImage";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLenis } from "lenis/react";

type GalleryImageItem = string | { url: string };

type VehicleGalleryProps = {
  images: GalleryImageItem[];
  vehicleName: string;
};

export function VehicleGallery({ images: rawImages, vehicleName }: VehicleGalleryProps) {
  const images = (rawImages ?? [])
    .map((img) => (typeof img === "string" ? img : img.url));

  const [isOpen, setIsOpen] = useState(false);
  const lenis = useLenis();
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const didSwipe = useRef(false);

  const hasImages = images.length > 0;
  const hasMultipleImages = images.length > 1;
  const activeImage = hasImages ? images[currentIndex] : "";

  const showPreviousImage = () => {
    if (hasMultipleImages) {
      setCurrentIndex((index) => (index - 1 + images.length) % images.length);
    }
  };

  const showNextImage = () => {
    if (hasMultipleImages) {
      setCurrentIndex((index) => (index + 1) % images.length);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        return;
      }

      if (!hasMultipleImages) {
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      ) {
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        setCurrentIndex((index) => (index + 1) % images.length);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        setCurrentIndex((index) => (index - 1 + images.length) % images.length);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [hasMultipleImages, images.length, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    lenis?.stop();
    return () => {
      document.body.style.overflow = previousOverflow;
      lenis?.start();
    };
  }, [isOpen, lenis]);

  const openImage = (index: number) => {
    if (!hasImages) {
      return;
    }

    setCurrentIndex(index);
    setIsOpen(true);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
    didSwipe.current = false;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) {
      return;
    }

    const delta = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (!hasMultipleImages || Math.abs(delta) < 40) {
      return;
    }

    didSwipe.current = true;
    if (delta < 0) {
      showNextImage();
    } else {
      showPreviousImage();
    }
    window.setTimeout(() => {
      didSwipe.current = false;
    }, 500);
  };

  const handleMainImageClick = () => {
    if (didSwipe.current) {
      didSwipe.current = false;
      return;
    }
    openImage(currentIndex);
  };

  return (
    <>
      <div className="gallery-grid">
        {hasImages ? (
          <>
            <div
              className="detail-gallery-item gallery-main"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <button
                type="button"
                className="gallery-open-button"
                onClick={handleMainImageClick}
                data-cursor="Zoom"
                aria-label={`Ouvrir la photo ${currentIndex + 1} de ${vehicleName}`}
              >
                <CarImage
                  key={currentIndex}
                  src={activeImage}
                  alt={`${vehicleName} vue ${currentIndex + 1}`}
                  fill
                  priority={currentIndex === 0}
                  sizes="(max-width: 900px) 100vw, 60vw"
                  className="gallery-thumb-image pointer-events-none"
                />
              </button>
              {hasMultipleImages && (
                <div className="gallery-nav">
                  <button
                    type="button"
                    className="gallery-nav-button"
                    aria-label="Photo précédente"
                    onClick={showPreviousImage}
                  >
                    <ChevronLeft aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="gallery-nav-button"
                    aria-label="Photo suivante"
                    onClick={showNextImage}
                  >
                    <ChevronRight aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
            {hasMultipleImages && (
              <div className="gallery-thumbnails" aria-label="Miniatures des photos">
                {images.map((image, index) => (
                  <button
                    key={`${vehicleName}-${index}`}
                    type="button"
                    className={`gallery-thumbnail ${
                      currentIndex === index ? "is-active" : ""
                    }`}
                    onClick={() => setCurrentIndex(index)}
                    aria-label={`Afficher la photo ${index + 1} de ${vehicleName}`}
                    aria-current={currentIndex === index ? "true" : undefined}
                  >
                    <CarImage
                      src={image}
                      alt=""
                      fill
                      sizes="100px"
                      className="gallery-thumb-image pointer-events-none"
                    />
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="detail-gallery-item detail-gallery-empty">
            <p>Aucune photo disponible pour le moment.</p>
          </div>
        )}
      </div>

      {isOpen && hasImages && (
        <div
          className="gallery-lightbox"
          data-lenis-prevent
          role="dialog"
          aria-modal="true"
          aria-label={`Vue de ${vehicleName}`}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <div className="gallery-lightbox-inner">
            <button
              type="button"
              className="gallery-lightbox-close"
              aria-label="Fermer la galerie"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>

            <div className="gallery-lightbox-counter">
              {currentIndex + 1} / {images.length}
            </div>

            <div
              className="gallery-lightbox-image-frame"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <CarImage
                key={currentIndex}
                src={activeImage}
                alt={`${vehicleName} vue ${currentIndex + 1}`}
                fill
                sizes="100vw"
                className="gallery-lightbox-image pointer-events-none"
              />
              {hasMultipleImages && (
                <div className="gallery-lightbox-nav">
                  <button
                    type="button"
                    className="gallery-lightbox-button"
                    aria-label="Photo précédente"
                    onClick={showPreviousImage}
                  >
                    <ChevronLeft aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="gallery-lightbox-button"
                    aria-label="Photo suivante"
                    onClick={showNextImage}
                  >
                    <ChevronRight aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
            {hasMultipleImages && (
              <div className="gallery-modal-thumbnails" aria-label="Miniatures des photos">
                {images.map((image, index) => (
                  <button
                    key={`modal-${vehicleName}-${index}`}
                    type="button"
                    className={`gallery-thumbnail ${
                      currentIndex === index ? "is-active" : ""
                    }`}
                    onClick={() => setCurrentIndex(index)}
                    aria-label={`Afficher la photo ${index + 1} de ${vehicleName}`}
                    aria-current={currentIndex === index ? "true" : undefined}
                  >
                    <CarImage
                      src={image}
                      alt=""
                      fill
                      sizes="100px"
                      className="gallery-thumb-image pointer-events-none"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
