export const SITE_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/voitures", label: "Véhicules" },
  { href: "/vendre-echanger", label: "Vendre / Échanger" },
  { href: "/contact", label: "Contact" },
] as const;

export function isActiveLink(pathname: string | null, href: string) {
  if (!pathname) return false;
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
