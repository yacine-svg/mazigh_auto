"use client";

import Image, { type ImageProps } from "next/image";
import { Car } from "lucide-react";
import { isCarImageStorageUrl } from "@/lib/car-images";

type CarImageProps = Omit<ImageProps, "src"> & {
  src: string | null | undefined;
};

export function CarImage({ src, alt, fill, className, ...props }: CarImageProps) {
  if (!src || !isCarImageStorageUrl(src)) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center bg-surface-2 text-fg-3 ${
          fill ? "absolute inset-0" : "h-full w-full"
        } ${className ?? ""}`}
      >
        <Car className="h-10 w-10 opacity-60" aria-hidden="true" />
      </div>
    );
  }

  return <Image src={src} alt={alt} fill={fill} className={className} {...props} />;
}
