import Link from "next/link";

/** The M-shield emblem from the favicon, drawn inline so it stays crisp. */
export function Emblem({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <path d="M10 14 L32 6 L54 14 L54 44 L32 58 L10 44 Z" fill="#111112" stroke="#e3262f" strokeWidth="2" />
      <path d="M18 20 L32 14 L46 20 L40 26 L32 22 L24 26 Z" fill="#e3262f" />
      <path d="M20 42 L20 28 L32 39 L44 28 L44 42" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type WordmarkProps = {
  href?: string | null;
  className?: string;
  /** Second line under the name, e.g. "Showroom" or "Admin". */
  suffix?: string;
};

export function Wordmark({ href = "/", className = "", suffix = "Showroom · El Khroub" }: WordmarkProps) {
  const content = (
    <span className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <Emblem />
      <span className="flex flex-col leading-none">
        <span className="display text-[1.15rem] tracking-[0.02em]">
          Mazigh<span className="text-brand"> Auto</span>
        </span>
        {suffix && (
          <span className="mt-1 font-mono text-[0.56rem] uppercase tracking-[0.28em] text-fg-3">{suffix}</span>
        )}
      </span>
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} aria-label="MAZIGH AUTO - Showroom Kecherid Auto" className="inline-flex">
      {content}
    </Link>
  );
}
