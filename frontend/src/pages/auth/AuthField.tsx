import type { ReactNode } from "react";

type AuthFieldProps = {
  label: string;
  children: ReactNode;
};

export default function AuthField({ label, children }: AuthFieldProps) {
  return (
    <label className="auth-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
