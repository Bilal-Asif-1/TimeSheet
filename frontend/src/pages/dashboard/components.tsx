import type { ReactNode } from "react";

export function KpiCard({ label, note, tone, value, onClick }: { label: string; note: string; tone: string; value: number; onClick?: () => void }) {
  const content = <><span>{label}</span><strong>{value}</strong><small>{note}</small></>;
  if (onClick) return <button className={`dashboard-kpi-card ${tone} clickable`} onClick={onClick} type="button">{content}</button>;
  return <div className={`dashboard-kpi-card ${tone}`}>{content}</div>;
}

export function StatusRow({ label, value }: { label: string; value: number }) {
  return <div className="status-row"><span>{label}</span><strong>{value}</strong></div>;
}

export function InfoTile({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return <div className={`info-tile${className ? ` ${className}` : ""}`}><span>{label}</span><strong>{value}</strong></div>;
}

export function PageCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`workspace-card${className ? ` ${className}` : ""}`}>{children}</div>;
}
