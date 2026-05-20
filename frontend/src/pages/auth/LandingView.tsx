type LandingViewProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  onLogin: () => void;
  onRegister: () => void;
};

export default function LandingView({
  eyebrow,
  title,
  subtitle,
  onLogin,
  onRegister,
}: LandingViewProps) {
  return (
    <div className="flow-auth-shell timesheet-landing-shell auth-login-landing">
      <main className="timesheet-landing">
        <section className="timesheet-hero login-only-hero">
          <div className="hero-copy">
            <div className="auth-form-brand">TimeSheet</div>
            <p className="flow-eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p className="hero-text">{subtitle}</p>
            <div className="hero-actions">
              <button className="btn btn-primary" type="button" onClick={onLogin}>
                Login to TimeSheet
              </button>
              <button className="btn btn-ghost" type="button" onClick={onRegister}>
                Create User Account
              </button>
            </div>
          </div>

          <section className="product-preview login-preview" aria-label="TimeSheet workspace preview">
            <div className="preview-toolbar">
              <span />
              <span />
              <span />
              <strong>Workspace preview</strong>
            </div>
            <div className="preview-grid">
              <Metric label="My hours" value="38" />
              <Metric label="Team members" value="12" />
              <Metric label="Departments" value="4" />
            </div>
            <div className="workflow-nodes login-workflow" aria-hidden="true">
              <span>Login</span>
              <i />
              <span>Create or Join Organization</span>
              <i />
              <span>Track Work</span>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-panel">
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}
