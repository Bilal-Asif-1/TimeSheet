type LandingViewProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  onLogin: () => void;
  onRegister: () => void;
};

const styles = {
  shell:
    "h-screen overflow-hidden bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.14),transparent_24%),radial-gradient(circle_at_84%_20%,rgba(255,255,255,0.1),transparent_26%),linear-gradient(135deg,#050505_0%,#111111_42%,#1f2937_100%)] text-slate-50",
  main: "mx-auto h-[calc(100vh-104px)] max-w-[1180px] overflow-hidden px-6 pb-[18px] pt-6",
  hero:
    "grid h-full min-h-0 grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)] items-center gap-14 max-[768px]:h-auto max-[768px]:grid-cols-1 max-[768px]:gap-7",
  brand:
    "mb-3.5 inline-block bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-[28px] font-black tracking-normal text-transparent",
  eyebrow: "mb-3 text-xs font-extrabold uppercase tracking-normal text-slate-300",
  title: "mb-[18px] text-[60px] leading-[0.96] text-white max-[768px]:text-[42px]",
  subtitle: "max-w-[620px] text-lg leading-[1.6] text-slate-300 max-[768px]:text-base",
  actions: "mt-6 flex flex-wrap gap-[18px] max-[768px]:w-full max-[768px]:flex-col",
  primaryButton:
    "min-h-11 rounded-xl bg-zinc-600 px-5 font-extrabold text-white shadow-[0_16px_30px_rgba(0,0,0,0.24)] transition hover:-translate-y-px",
  ghostButton:
    "min-h-11 rounded-xl border border-white/20 bg-white/10 px-5 font-extrabold text-white transition hover:-translate-y-px hover:bg-white/15",
  preview:
    "grid min-h-[360px] content-center gap-[18px] rounded-[28px] border border-white/[0.13] bg-white/[0.08] p-3.5 shadow-[0_26px_70px_rgba(0,0,0,0.38)] backdrop-blur-[18px] max-[768px]:min-h-[260px]",
  toolbar: "mb-3 flex min-h-11 items-center gap-2 border-b border-white/10 text-slate-300",
  dot: "h-2.5 w-2.5 rounded-full bg-slate-400",
  grid: "grid grid-cols-3 gap-3 max-[768px]:grid-cols-1",
  workflow:
    "mt-2.5 flex min-h-[84px] items-center justify-between gap-2 rounded-[18px] border border-white/10 bg-white/[0.06] p-3",
  workflowNode: "rounded-full bg-white/10 px-3 py-2 text-xs font-extrabold text-white",
  workflowLine: "h-1 min-w-10 flex-1 rounded-full bg-white/40",
};

export default function LandingView({
  eyebrow,
  title,
  subtitle,
  onLogin,
  onRegister,
}: LandingViewProps) {
  return (
    <div className={styles.shell}>
      <main className={styles.main}>
        <section className={styles.hero}>
          <div>
            <div className={styles.brand}>TimeSheet</div>
            <p className={styles.eyebrow}>{eyebrow}</p>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.subtitle}>{subtitle}</p>
            <div className={styles.actions}>
              <button className={styles.primaryButton} type="button" onClick={onLogin}>
                Login to TimeSheet
              </button>
              <button className={styles.ghostButton} type="button" onClick={onRegister}>
                Create User Account
              </button>
            </div>
          </div>

          <section className={styles.preview} aria-label="TimeSheet workspace preview">
            <div className={styles.toolbar}>
              <span className={styles.dot} />
              <span className={styles.dot} />
              <span className={styles.dot} />
              <strong className="ml-auto text-[13px]">Workspace preview</strong>
            </div>
            <div className={styles.grid}>
              <Metric label="My hours" value="38" />
              <Metric label="Team members" value="12" />
              <Metric label="Departments" value="4" />
            </div>
            <div className={styles.workflow} aria-hidden="true">
              <span className={styles.workflowNode}>Login</span>
              <i className={styles.workflowLine} />
              <span className={styles.workflowNode}>Create or Join Organization</span>
              <i className={styles.workflowLine} />
              <span className={styles.workflowNode}>Track Work</span>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-3.5">
      <p className="mb-2 text-[13px] text-zinc-400">{label}</p>
      <strong className="text-[26px] text-white">{value}</strong>
    </div>
  );
}
