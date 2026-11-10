"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useLenis } from "lenis/react";
import { ArrowUpRight, MessageCircle, Phone } from "lucide-react";
import { Wordmark } from "@/app/components/Wordmark";
import { Magnetic } from "./Magnetic";
import { SITE_LINKS, isActiveLink } from "./nav";
import { SHOWROOM_CONFIG, buildGenericWhatsAppUrl } from "@/lib/config";

function Roll({ children }: { children: string }) {
  return (
    <span className="roll">
      <span>{children}</span>
      <span aria-hidden="true">{children}</span>
    </span>
  );
}

function HeaderBase({ pathname }: { pathname: string | null }) {
  const lenis = useLenis();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const lastY = useRef(0);

  // Frosted after scrolling, hides when scrolling down, comes back on scroll up.
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      setHidden(y > 320 && y > lastY.current + 4);
      if (y < lastY.current - 4 || y < 320) setHidden(false);
      lastY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!lenis) return;
    if (open) lenis.stop();
    else lenis.start();
  }, [open, lenis]);

  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const mq = window.matchMedia("(min-width: 900px)");
    const onMq = () => mq.matches && setOpen(false);
    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);
    return () => {
      document.documentElement.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
    };
  }, [open]);

  const state = open ? "is-open" : `${scrolled ? "is-scrolled" : ""} ${hidden ? "is-hidden" : ""}`;

  return (
    <>
      <header className={`site-header ${state}`}>
        <div className="wrap site-header-inner">
          <span className="relative z-10" onClick={() => setOpen(false)}>
            <Wordmark />
          </span>

          <nav aria-label="Navigation principale" className="hidden items-center gap-9 min-[900px]:flex">
            {SITE_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="nav-link"
                aria-current={isActiveLink(pathname, l.href) ? "page" : undefined}
              >
                <Roll>{l.label}</Roll>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <Magnetic>
              <a
                href={buildGenericWhatsAppUrl()}
                target="_blank"
                rel="noreferrer"
                className="btn btn-wa btn-sm hidden sm:inline-flex"
              >
                <MessageCircle aria-hidden="true" />
                <Roll>WhatsApp</Roll>
              </a>
            </Magnetic>
            <button
              type="button"
              className="relative grid h-11 w-11 place-items-center rounded-full border border-line-2 bg-bg/40 min-[900px]:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
              onClick={() => setOpen((v) => !v)}
            >
              <span
                className={`absolute h-px w-5 bg-fg transition-transform duration-500 ease-[var(--ease-premium)] ${open ? "rotate-45" : "-translate-y-[4px]"}`}
                aria-hidden="true"
              />
              <span
                className={`absolute h-px w-5 bg-fg transition-transform duration-500 ease-[var(--ease-premium)] ${open ? "-rotate-45" : "translate-y-[4px]"}`}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu: a sibling of the header so it always covers the whole screen. */}
      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        inert={!open}
        data-lenis-prevent
        className={`fixed inset-0 z-[75] flex h-[100dvh] flex-col bg-bg transition-[opacity,visibility] duration-500 ease-[var(--ease-premium)] min-[900px]:hidden ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,rgba(227,38,47,0.18),transparent_55%)]" aria-hidden="true" />
        <div className="relative flex flex-1 flex-col overflow-y-auto pt-24" style={{ paddingBottom: "calc(1.75rem + env(safe-area-inset-bottom, 0px))" }}>
          <nav aria-label="Navigation mobile" className="wrap">
            <ul className="border-t border-line">
              {SITE_LINKS.map((l, i) => {
                const active = isActiveLink(pathname, l.href);
                return (
                  <li
                    key={l.href}
                    className={`border-b border-line transition-[opacity,transform] duration-700 ease-[var(--ease-premium)] ${
                      open ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                    }`}
                    style={{ transitionDelay: open ? `${120 + i * 70}ms` : "0ms" }}
                  >
                    <Link
                      href={l.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setOpen(false)}
                      className={`display flex items-center justify-between py-5 text-[2.3rem] ${active ? "text-brand" : "text-fg"}`}
                    >
                      {l.label}
                      <ArrowUpRight className={`h-6 w-6 ${active ? "text-brand" : "text-fg-3"}`} aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div
            className={`wrap mt-auto pt-10 transition-opacity duration-700 ${open ? "opacity-100" : "opacity-0"}`}
            style={{ transitionDelay: open ? "420ms" : "0ms" }}
          >
            <div className="grid gap-3">
              <a href={buildGenericWhatsAppUrl()} target="_blank" rel="noreferrer" className="btn btn-wa btn-block btn-lg">
                <MessageCircle aria-hidden="true" /> WhatsApp
              </a>
              <a href={`tel:${SHOWROOM_CONFIG.phoneRaw}`} className="btn btn-ghost btn-block btn-lg">
                <Phone aria-hidden="true" /> {SHOWROOM_CONFIG.phoneDisplay}
              </a>
            </div>
            <p className="mt-6 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-fg-3">{SHOWROOM_CONFIG.fullAddress}</p>
          </div>
        </div>
      </div>
    </>
  );
}

function HeaderWithPath() {
  return <HeaderBase pathname={usePathname()} />;
}

export function SiteHeader() {
  return (
    <Suspense fallback={<HeaderBase pathname={null} />}>
      <HeaderWithPath />
    </Suspense>
  );
}
