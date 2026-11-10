import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="adm-head">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  sub,
  icon,
  action,
  children,
  body = true,
  className = "",
  id,
}: {
  title: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  body?: boolean;
  className?: string;
  id?: string;
}) {
  return (
    <section className={`panel ${className}`} id={id}>
      <div className="panel-head">
        <div className="min-w-0">
          <h2>
            {icon}
            {title}
          </h2>
          {sub && <div className="panel-sub">{sub}</div>}
        </div>
        {action}
      </div>
      {body ? <div className="panel-body">{children}</div> : children}
    </section>
  );
}

export function Kpi({
  label,
  icon,
  value,
  unit,
  foot,
  alert,
  href,
  accent,
}: {
  label: ReactNode;
  icon?: ReactNode;
  value: ReactNode;
  unit?: string;
  foot?: ReactNode;
  alert?: boolean;
  href?: string;
  accent?: boolean;
}) {
  const body = (
    <>
      {accent && <span className="kpi-accent" aria-hidden="true" />}
      <span className="kpi-label">
        {icon}
        {label}
      </span>
      <span className="kpi-value">
        {value}
        {unit && <small>{unit}</small>}
      </span>
      <span className="kpi-foot">{foot}</span>
    </>
  );
  const cls = `kpi${alert ? " is-alert" : ""}`;
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function Delta({ cur, prev, suffix = "%" }: { cur: number; prev: number; suffix?: string }) {
  if (!prev) return <span className="delta flat">—</span>;
  const d = (cur - prev) / Math.abs(prev);
  const cls = Math.abs(d) < 0.005 ? "flat" : d > 0 ? "up" : "down";
  return (
    <span className={`delta ${cls}`}>
      {d > 0 ? "+" : ""}
      {Math.round(d * 100)} {suffix}
    </span>
  );
}
