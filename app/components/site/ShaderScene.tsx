"use client";

import { useEffect } from "react";
import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";

export type ShaderPreset = "hero" | "login" | "cta";

/**
 * ShaderGradient presets in the brand colours: a slow molten-red "paint"
 * surface for the hero, a calmer variant for the login and CTA panels.
 */
const PRESETS = {
  hero: {
    type: "waterPlane",
    color1: "#e3262f",
    color2: "#3a0508",
    color3: "#070707",
    uSpeed: 0.18,
    uStrength: 2.6,
    uDensity: 1.25,
    uFrequency: 5.5,
    uAmplitude: 0,
    positionX: -1.2,
    positionY: 0,
    positionZ: 0,
    rotationX: 0,
    rotationY: 10,
    rotationZ: 50,
    cAzimuthAngle: 180,
    cPolarAngle: 90,
    cDistance: 3.4,
    brightness: 1.05,
    reflection: 0.12,
  },
  login: {
    type: "sphere",
    color1: "#e3262f",
    color2: "#1a0204",
    color3: "#000000",
    uSpeed: 0.14,
    uStrength: 1.6,
    uDensity: 1.1,
    uFrequency: 5.5,
    uAmplitude: 1.4,
    positionX: -0.2,
    positionY: 0,
    positionZ: 0,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    cAzimuthAngle: 180,
    cPolarAngle: 80,
    cDistance: 4.2,
    brightness: 1.1,
    reflection: 0.25,
  },
  cta: {
    type: "plane",
    color1: "#7a0a10",
    color2: "#e3262f",
    color3: "#0b0b0b",
    uSpeed: 0.12,
    uStrength: 3.2,
    uDensity: 1.6,
    uFrequency: 5.5,
    uAmplitude: 0,
    positionX: 0,
    positionY: 0.6,
    positionZ: 0,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 225,
    cAzimuthAngle: 180,
    cPolarAngle: 90,
    cDistance: 3.2,
    brightness: 1.0,
    reflection: 0.1,
  },
} as const;

export default function ShaderScene({ preset = "hero", onReady }: { preset?: ShaderPreset; onReady?: () => void }) {
  const p = PRESETS[preset];

  // Give the first frames time to render before fading the scene in.
  useEffect(() => {
    const t = window.setTimeout(() => onReady?.(), 450);
    return () => window.clearTimeout(t);
  }, [onReady]);

  return (
    <ShaderGradientCanvas
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      pixelDensity={1}
      fov={45}
    >
      <ShaderGradient
        animate="on"
        control="props"
        type={p.type}
        shader="defaults"
        lightType="3d"
        grain="on"
        color1={p.color1}
        color2={p.color2}
        color3={p.color3}
        uSpeed={p.uSpeed}
        uStrength={p.uStrength}
        uDensity={p.uDensity}
        uFrequency={p.uFrequency}
        uAmplitude={p.uAmplitude}
        positionX={p.positionX}
        positionY={p.positionY}
        positionZ={p.positionZ}
        rotationX={p.rotationX}
        rotationY={p.rotationY}
        rotationZ={p.rotationZ}
        cAzimuthAngle={p.cAzimuthAngle}
        cPolarAngle={p.cPolarAngle}
        cDistance={p.cDistance}
        brightness={p.brightness}
        reflection={p.reflection}
      />
    </ShaderGradientCanvas>
  );
}
