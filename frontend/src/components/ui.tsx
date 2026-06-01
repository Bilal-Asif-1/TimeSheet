import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type ButtonTone = "primary" | "secondary" | "danger";

const buttonTone: Record<ButtonTone, string> = {
  primary: "border-white/15 bg-white text-black hover:bg-zinc-200",
  secondary: "border-white/15 bg-white/10 text-white hover:bg-white/15",
  danger: "border-red-300/25 bg-red-400/10 text-red-100 hover:bg-red-400/20",
};

export function Button({ className = "", tone = "secondary", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: ButtonTone }) {
  return (
    <button
      className={`min-h-11 rounded-xl border px-5 font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${buttonTone[tone]} ${className}`}
      type={props.type || "button"}
      {...props}
    />
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-[22px] border border-white/10 bg-[radial-gradient(circle_at_90%_10%,rgba(255,255,255,0.1),transparent_24%),linear-gradient(145deg,rgba(10,10,10,0.94),rgba(31,41,55,0.9))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.36)] ${className}`}>
      {children}
    </section>
  );
}

export function PageHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-xs font-extrabold uppercase text-zinc-400">{eyebrow}</p>
        <h2 className="text-2xl font-black text-white">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function Field(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="rounded-xl border border-white/15 bg-white/10 px-3.5 py-3 text-white outline-none placeholder:text-zinc-400 focus:border-white/70 focus:ring-4 focus:ring-white/10" {...props} />;
}

export function SelectField(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="rounded-xl border border-white/15 bg-white/10 px-3.5 py-3 text-white outline-none focus:border-white/70 focus:ring-4 focus:ring-white/10" {...props} />;
}

export function TextAreaField(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="rounded-xl border border-white/15 bg-white/10 px-3.5 py-3 text-white outline-none placeholder:text-zinc-400 focus:border-white/70 focus:ring-4 focus:ring-white/10" {...props} />;
}

export function Badge({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`rounded-full bg-white/10 px-2.5 py-1 text-xs font-black uppercase text-white ${className}`}>{children}</span>;
}
