"use client";

import { useLenis } from "lenis/react";
import { useEffect, useRef, type ReactNode } from "react";

type MarqueeProps = {
  children: ReactNode;
  /** Pixels per second at rest. */
  speed?: number;
  className?: string;
};

/**
 * Infinite marquee whose speed reacts to the Lenis scroll velocity:
 * scrolling down pushes it forward, scrolling up reverses it.
 */
export function Marquee({ children, speed = 60, className = "" }: MarqueeProps) {
  const track = useRef<HTMLDivElement>(null);
  const velocity = useRef(0);
  const direction = useRef(1);

  useLenis((lenis) => {
    velocity.current = lenis.velocity;
    if (lenis.direction) direction.current = lenis.direction;
  });

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let x = 0;
    let last = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const boost = 1 + Math.min(8, Math.abs(velocity.current) * 0.25);
      x -= speed * dt * boost * direction.current;
      const half = el.scrollWidth / 2;
      if (half > 0) {
        if (-x >= half) x += half;
        if (x > 0) x -= half;
      }
      el.style.transform = `translate3d(${x}px, 0, 0)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [speed]);

  return (
    <div className={`marquee ${className}`}>
      <div ref={track} className="marquee-track" style={{ gap: 0, paddingRight: 0 }}>
        <div className="marquee-track">{children}</div>
        <div className="marquee-track" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
