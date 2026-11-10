"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { gsap, useGSAP, MOTION_OK } from "@/lib/gsap";

type RevealProps = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  delay?: number;
  y?: number;
  /** Animate the descendants marked with data-reveal one after another. */
  stagger?: number;
};

/** Fades and lifts content into view as it enters the viewport. */
export function Reveal({ children, className, as: Tag = "div", delay = 0, y = 36, stagger }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const targets = stagger ? el.querySelectorAll("[data-reveal]") : el;
        gsap.from(targets, {
          y,
          autoAlpha: 0,
          duration: 1.1,
          delay,
          stagger: stagger ?? 0,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}

/** Headline whose lines slide up from a mask when scrolled into view. */
export function LineReveal({ lines, className = "", as: Tag = "h2" }: { lines: ReactNode[]; className?: string; as?: ElementType }) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from(el.querySelectorAll(".line-mask > span"), {
          yPercent: 110,
          duration: 1.2,
          stagger: 0.08,
          ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={className}>
      {lines.map((line, i) => (
        <span key={i} className="line-mask">
          <span>{line}</span>
        </span>
      ))}
    </Tag>
  );
}
