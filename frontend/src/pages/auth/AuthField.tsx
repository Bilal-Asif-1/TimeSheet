import type { ReactNode } from "react";

type AuthFieldProps = {
  label: string;
  children: ReactNode;
};

// Login/register input ko label ke sath same layout dene wala chota wrapper.
export default function AuthField({ label, children }: AuthFieldProps) {
  return (
    <label className="grid gap-1.5 text-[13px] font-extrabold text-slate-50">
      <span>{label}</span>
      {children}
    </label>
  );
}
