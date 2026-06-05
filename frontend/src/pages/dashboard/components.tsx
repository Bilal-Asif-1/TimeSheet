import type { ReactNode } from "react";

const cardBase =
  "rounded-[22px] border border-white/10 bg-[radial-gradient(circle_at_90%_10%,rgba(255,255,255,0.1),transparent_24%),linear-gradient(145deg,rgba(10,10,10,0.94),rgba(31,41,55,0.9))] shadow-[0_24px_70px_rgba(0,0,0,0.36)]";
const kpiBase =
  "relative grid min-h-[142px] gap-2.5 overflow-hidden rounded-[22px] border border-white/10 bg-[radial-gradient(circle_at_92%_12%,rgba(255,255,255,0.12),transparent_28%),linear-gradient(145deg,rgba(12,12,12,0.95),rgba(39,39,42,0.9))] p-5 text-left text-white shadow-[0_22px_60px_rgba(0,0,0,0.28)] after:absolute after:bottom-[18px] after:right-[18px] after:h-1 after:w-[42px] after:rounded-full";
const toneLine = {
  warning: "after:bg-amber-400",
  info: "after:bg-blue-300",
  success: "after:bg-green-300",
  neutral: "after:bg-zinc-300",
};

// Dashboard ke repeated KPI, status aur information cards is file se reuse hote hain.
export function KpiCard({ label, note, tone, value, onClick }: { label: string; note: string; tone: string; value: number; onClick?: () => void }) {
  const className = `${kpiBase} ${toneLine[tone as keyof typeof toneLine] || toneLine.neutral} ${
    onClick ? "w-full cursor-pointer transition hover:-translate-y-0.5 hover:border-white/30" : ""
  }`;
  const content = <><span className="text-[13px] font-extrabold text-zinc-400">{label}</span><strong className="text-[42px] leading-none">{value}</strong><small className="text-[13px] font-extrabold text-zinc-400">{note}</small></>;
  if (onClick) return <button className={className} onClick={onClick} type="button">{content}</button>;
  return <div className={className}>{content}</div>;
}

export function StatusRow({ label, value }: { label: string; value: number }) {
  return <div className="flex min-h-[58px] items-center justify-between gap-3.5 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3.5"><span className="text-[13px] text-zinc-400">{label}</span><strong className="text-white">{value}</strong></div>;
}

export function InfoTile({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return <div className={`grid gap-1.5 rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 ${className}`}><span className="text-[13px] font-extrabold text-zinc-400">{label}</span><strong className="text-white">{value}</strong></div>;
}

export function PageCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`${cardBase}${className ? ` ${className}` : ""}`}>{children}</div>;
}
