"use client";

import { useEffect, useRef, useState } from "react";
import { ShaderBackground } from "./ShaderBackground";

const UNICORN_SRC =
  "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.2.12/dist/unicornStudio.umd.js";

function loadUnicorn(): Promise<void> {
  if (window.UnicornStudio) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-unicorn]");
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Unicorn Studio failed to load")), { once: true });
      return;
    }
    const s = document.createElement("script");
    s.src = UNICORN_SRC;
    s.async = true;
    s.dataset.unicorn = "true";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Unicorn Studio failed to load"));
    document.head.appendChild(s);
  });
}

const projectId = process.env.NEXT_PUBLIC_UNICORN_PROJECT_ID ?? "";

/**
 * Slot for a Unicorn Studio scene (set NEXT_PUBLIC_UNICORN_PROJECT_ID to the
 * embed ID). Until a scene is set, or on phones / reduced motion, it shows the
 * ShaderGradient fallback instead.
 */
export function UnicornScene({ className = "" }: { className?: string }) {
  const [useScene, setUseScene] = useState(false);
  const [ready, setReady] = useState(false);
  const scenes = useRef<UnicornScene[]>([]);

  useEffect(() => {
    if (!projectId) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const desktop = window.matchMedia("(min-width: 768px)").matches;
    if (reduce || !desktop) return;
    const t = window.setTimeout(() => setUseScene(true), 600);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!useScene) return;
    let cancelled = false;
    loadUnicorn()
      .then(() => window.UnicornStudio?.init())
      .then((list) => {
        if (cancelled) {
          list?.forEach((s) => s.destroy?.());
          return;
        }
        scenes.current = list ?? [];
        setReady(true);
      })
      .catch(() => setUseScene(false));
    return () => {
      cancelled = true;
      scenes.current.forEach((s) => s.destroy?.());
      scenes.current = [];
    };
  }, [useScene]);

  return (
    <div className={`absolute inset-0 ${className}`} aria-hidden="true">
      {!ready && <ShaderBackground preset="cta" />}
      {useScene && (
        <div
          data-us-project={projectId}
          data-us-production="true"
          className={`absolute inset-0 transition-opacity duration-[1800ms] ease-out ${ready ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </div>
  );
}
