"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  CarFront,
  ChartNoAxesCombined,
  ExternalLink,
  LayoutGrid,
  LogOut,
  Menu,
  Moon,
  Plus,
  Search,
  Sun,
  X,
} from "lucide-react";
import { Wordmark } from "@/app/components/Wordmark";
import { CarImage } from "@/app/components/CarImage";
import { signOutAction } from "@/app/admin/auth-actions";

export type AdminSearchItem = {
  id: string;
  label: string;
  sub: string;
  href: string;
  image?: string | null;
  keywords: string;
};

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  exact?: boolean;
  badge?: number;
  hot?: boolean;
};

type AdminShellProps = {
  email: string | null;
  searchIndex: AdminSearchItem[];
  counts: { stock: number; reserved: number; drafts: number; aging: number };
  children: ReactNode;
};

const THEME_KEY = "mz.admin.theme";

const TITLES: Array<[RegExp, string]> = [
  [/^\/admin$/, "Tableau de bord"],
  [/^\/admin\/voitures$/, "Véhicules"],
  [/^\/admin\/voitures\/nouveau/, "Ajouter un véhicule"],
  [/^\/admin\/voitures\/.+\/modifier/, "Modifier un véhicule"],
  [/^\/admin\/finances/, "Finances"],
];

function initials(email: string | null) {
  if (!email) return "MA";
  const name = email.split("@")[0].replace(/[^a-zA-Z]/g, " ").trim();
  const parts = name.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "M") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "A")).toUpperCase();
}

export function AdminShell({ email, searchIndex, counts, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [sbOpen, setSbOpen] = useState(false);
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(THEME_KEY);
      if (saved === "light" || saved === "dark") setTheme(saved);
    } catch {
      // storage unavailable: keep the default theme
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    setSbOpen(false);
  }, [pathname]);

  // ⌘K / Ctrl+K focuses the search, "/" too when not typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName);
      if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") || (e.key === "/" && !typing)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") setSbOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    const query = q.trim().toLocaleLowerCase("fr");
    if (query.length < 2) return [];
    return searchIndex.filter((item) => item.keywords.includes(query)).slice(0, 8);
  }, [q, searchIndex]);

  const go = (item?: AdminSearchItem) => {
    if (!item) return;
    setQ("");
    searchRef.current?.blur();
    router.push(item.href);
  };

  const nav: Array<{ label: string; items: NavItem[] }> = [
    {
      label: "Pilotage",
      items: [
        { href: "/admin", exact: true, label: "Tableau de bord", icon: <LayoutGrid /> },
        { href: "/admin/finances", label: "Finances", icon: <ChartNoAxesCombined /> },
      ],
    },
    {
      label: "Showroom",
      items: [
        { href: "/admin/voitures", exact: true, label: "Véhicules", icon: <CarFront />, badge: counts.stock, hot: counts.aging > 0 },
        { href: "/admin/voitures/nouveau", label: "Ajouter un véhicule", icon: <Plus /> },
      ],
    },
  ];

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
  const title = TITLES.find(([re]) => re.test(pathname))?.[1] ?? "Administration";

  return (
    <div className="adm" data-theme={theme}>
      <div className="adm-grid">
        <aside className={`adm-sidebar ${sbOpen ? "is-open" : ""}`} aria-label="Navigation administration">
          <div className="relative flex items-center justify-between px-1.5 pb-2 pt-1">
            <Wordmark href="/admin" suffix="Back-office" />
            <button type="button" className="icon-btn lg:hidden" onClick={() => setSbOpen(false)} aria-label="Fermer le menu">
              <X />
            </button>
          </div>

          {nav.map((group) => (
            <div key={group.label} className="relative grid gap-0.5">
              <p className="adm-sb-label">{group.label}</p>
              {group.items.map((item) => (
                <Link key={item.href} href={item.href} className="adm-sb-link" aria-current={isActive(item) ? "page" : undefined}>
                  {item.icon}
                  <span>{item.label}</span>
                  {Boolean(item.badge) && <span className={`adm-sb-badge ${item.hot ? "hot" : ""}`}>{item.badge}</span>}
                </Link>
              ))}
            </div>
          ))}

          <div className="relative mx-1 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-line bg-line text-center">
            {[
              ["Stock", counts.stock],
              ["Réservées", counts.reserved],
              ["Brouillons", counts.drafts],
            ].map(([label, value]) => (
              <div key={label} className="bg-[#0d0d0e] px-1 py-2.5">
                <p className="mono text-base text-fg">{value}</p>
                <p className="mt-0.5 text-[0.6rem] uppercase tracking-[0.12em] text-fg-3">{label}</p>
              </div>
            ))}
          </div>

          <div className="relative mt-auto grid gap-2">
            <Link href="/" target="_blank" className="adm-sb-link">
              <ExternalLink />
              <span>Voir le site public</span>
            </Link>
            <div className="flex items-center gap-2.5 rounded-xl border border-line bg-[#0d0d0e] p-2.5">
              <span className="mono grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand/20 text-xs font-semibold text-[#ff8a8f]">
                {initials(email)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.82rem] font-semibold">{email ?? "Propriétaire"}</p>
                <p className="text-[0.7rem] text-fg-3">Propriétaire</p>
              </div>
              <form action={signOutAction}>
                <button type="submit" className="icon-btn" title="Se déconnecter" aria-label="Se déconnecter">
                  <LogOut />
                </button>
              </form>
            </div>
          </div>
        </aside>
        {sbOpen && <div className="adm-overlay lg:hidden" onClick={() => setSbOpen(false)} aria-hidden="true" />}

        <div className="adm-main">
          <header className="adm-topbar">
            <button type="button" className="icon-btn lg:hidden" onClick={() => setSbOpen(true)} aria-label="Ouvrir le menu">
              <Menu />
            </button>
            <p className="hidden min-w-0 truncate text-[0.95rem] font-semibold md:block md:w-48">{title}</p>

            <div className="adm-search">
              <Search aria-hidden="true" />
              <label className="sr-only" htmlFor="adm-search">
                Rechercher un véhicule
              </label>
              <input
                id="adm-search"
                ref={searchRef}
                className="field"
                type="search"
                autoComplete="off"
                placeholder="Rechercher un véhicule…"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setFocus(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setFocus((f) => Math.min(results.length - 1, f + 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setFocus((f) => Math.max(0, f - 1));
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    go(results[focus]);
                  } else if (e.key === "Escape") {
                    setQ("");
                  }
                }}
                onBlur={() => window.setTimeout(() => setQ(""), 150)}
              />
              <kbd className="kbd hidden sm:block">⌘K</kbd>
              {q.trim().length >= 2 && (
                <div className="popover" role="listbox">
                  {results.length ? (
                    results.map((r, i) => (
                      <button
                        key={r.id}
                        type="button"
                        role="option"
                        aria-selected={i === focus}
                        className={`pop-item ${i === focus ? "is-focus" : ""}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          go(r);
                        }}
                      >
                        <span className="pop-thumb">
                          <CarImage src={r.image} alt="" fill sizes="52px" className="object-cover" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">{r.label}</span>
                          <small className="truncate">{r.sub}</small>
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-4 text-sm text-fg-3">Aucun véhicule trouvé.</p>
                  )}
                </div>
              )}
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              <button
                type="button"
                className="icon-btn"
                onClick={toggleTheme}
                aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
                title={theme === "dark" ? "Mode clair" : "Mode sombre"}
              >
                {theme === "dark" ? <Sun /> : <Moon />}
              </button>
              <Link href="/admin/voitures/nouveau" className="btn btn-primary btn-sm">
                <Plus aria-hidden="true" />
                <span className="hidden sm:inline">Nouveau véhicule</span>
              </Link>
            </div>
          </header>

          <div key={pathname} className="adm-content" style={{ animation: "fade-in 0.35s ease both" }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
