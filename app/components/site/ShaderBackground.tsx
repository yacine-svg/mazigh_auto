"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import type { ShaderPreset } from "./ShaderScene";

// Three.js + the shader are only downloaded when the scene is actually shown.
const ShaderScene = dynamic(() => import("./ShaderScene"), { ssr: false });

function canRunWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Animated 3D gradient background. A CSS gradient paints first (and stays on
 * phones, low-power devices and for reduced motion); the WebGL scene fades in
 * on top once the browser is idle.
 */
export function ShaderBackground({ preset = "hero", className = "" }: { preset?: ShaderPreset; className?: string }) {
  const [show, setShow] = useState(false);
  const [ready, setReady] = useState(false);
  const markReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const desktop = window.matchMedia("(min-width: 768px)").matches;
    const weak = typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency < 4;
    if (reduce || !desktop || weak || !canRunWebGL()) return;

    const start = () => setShow(true);
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(start, { timeout: 1500 });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(start, 700);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <div className="hero-fallback" />
      {show && (
        <div
          className="absolute inset-0 transition-opacity duration-[1800ms] ease-out"
          style={{ opacity: ready ? 1 : 0 }}
        >
          <ShaderScene preset={preset} onReady={markReady} />
        </div>
      )}
    </div>
  );
}
