import { useMemo, useState, type ReactNode } from "react";
import { getApiBaseUrl } from "../config/env";

const API_BASE = getApiBaseUrl();

type AppUser = {
  id: number;
  name: string;
  email: string;
  provider: "local" | "microsoft";
  organizationId?: number | null;
  organizationCode?: string | null;
  role?: string | null;
  department?: string | null;
};

type LoginProps = {
  onAuthSuccess: (token: string, user: AppUser) => void;
  onMicrosoftLogin?: () => void | Promise<void>;
  isMicrosoftLoading?: boolean;
  msalEnabled?: boolean;
  msalDisabledReason?: string;
};

type AuthView = "landing" | "login" | "register";

export default function Login({
  onAuthSuccess,
  onMicrosoftLogin,
  isMicrosoftLoading = false,
  msalEnabled = true,
  msalDisabledReason,
}: LoginProps) {
  const [view, setView] = useState<AuthView>("landing");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isLoginView = view === "login";
  const viewCopy = useMemo(() => {
    switch (view) {
      case "login":
        return {
          eyebrow: "User access",
          title: "Login to TimeSheet",
          subtitle: "Use your personal account to manage timesheets, then create or join an organization from the dashboard.",
          primary: "Log In",
        };
      case "register":
        return {
          eyebrow: "Create account",
          title: "Register for TimeSheet",
          subtitle: "Create one user account first. Organization setup happens inside your workspace after login.",
          primary: "Register",
        };
      default:
        return {
          eyebrow: "TimeSheet platform",
          title: "Time, teams, and workspaces in one place",
          subtitle: "Login with one user account, then create or join your organization from inside the workspace.",
          primary: "Login to TimeSheet",
        };
    }
  }, [view]);

  const resetFeedback = () => {
    setError("");
  };

  const switchView = (nextView: AuthView) => {
    resetFeedback();
    setView(nextView);
  };

  const handleMicrosoftLogin = async () => {
    if (!msalEnabled || !onMicrosoftLogin) {
      setError(msalDisabledReason || "Microsoft sign-in is not available in this environment.");
      return;
    }

    try {
      await onMicrosoftLogin();
    } catch (loginError) {
      const err = loginError as Error;
      setError(err.message || "Microsoft sign-in failed.");
    }
  };

  const submitAuth = async () => {
    try {
      resetFeedback();
      setSubmitting(true);

      if (view === "login" && (!email.trim() || !password.trim())) {
        throw new Error("Email and password are required.");
      }

      if (view === "register" && (!name.trim() || !email.trim() || !password.trim())) {
        throw new Error("Full name, work email and password are required.");
      }

      const endpoint = isLoginView ? "login" : "register";
      const response = await fetch(`${API_BASE}/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          view === "register"
            ? { name, email, password }
            : { email, password },
        ),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Authentication failed.");
      }

      onAuthSuccess(payload.token, payload.user);
    } catch (authError) {
      const err = authError as Error;
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (view === "landing") {
    return (
      <div className="flow-auth-shell timesheet-landing-shell auth-login-landing">
        <main className="timesheet-landing">
          <section className="timesheet-hero login-only-hero">
            <div className="hero-copy">
              <div className="auth-form-brand">TimeSheet</div>
              <p className="flow-eyebrow">{viewCopy.eyebrow}</p>
              <h1>{viewCopy.title}</h1>
              <p className="hero-text">{viewCopy.subtitle}</p>
              <div className="hero-actions">
                <button className="btn btn-primary" type="button" onClick={() => switchView("login")}>
                  Login to TimeSheet
                </button>
                <button className="btn btn-ghost" type="button" onClick={() => switchView("register")}>
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
                <div className="metric-panel">
                  <p>My hours</p>
                  <strong>38</strong>
                </div>
                <div className="metric-panel">
                  <p>Team members</p>
                  <strong>12</strong>
                </div>
                <div className="metric-panel">
                  <p>Departments</p>
                  <strong>4</strong>
                </div>
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

  return (
    <div className="flow-auth-shell timesheet-landing-shell auth-only-landing">
      <main className="auth-experience">
        <section className="auth-card-pro">
          <button
            className="form-back-button"
            type="button"
            onClick={() => switchView("landing")}
            aria-label="Back to landing"
          >
            ←
          </button>
          <div className="auth-form-brand">TimeSheet</div>
          <p className="flow-eyebrow">{viewCopy.eyebrow}</p>
          <h1>{viewCopy.title}</h1>
          <p className="auth-subtitle">{viewCopy.subtitle}</p>

          <div className="form-grid">
            {isLoginView && (
              <>
                <Field label="Username or Email Address">
                  <input
                    className="auth-input"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@company.com"
                  />
                </Field>
                <Field label="Password">
                  <input
                    className="auth-input"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter password"
                  />
                </Field>
              </>
            )}

            {view === "register" && (
              <>
                <Field label="Full Name">
                  <input
                    className="auth-input"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="John Doe"
                  />
                </Field>
                <Field label="Work Email">
                  <input
                    className="auth-input"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@company.com"
                  />
                </Field>
                <Field label="Password">
                  <input
                    className="auth-input"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Create password"
                  />
                </Field>
              </>
            )}
          </div>

          {isLoginView && (
            <label className="remember-row enterprise-row">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <span>Remember Me</span>
            </label>
          )}

          {msalEnabled && isLoginView ? (
            <button className="btn ms-btn" type="button" onClick={handleMicrosoftLogin} disabled={isMicrosoftLoading}>
              <span className="ms-logo" aria-hidden="true">
                <span className="ms-tile ms-red" />
                <span className="ms-tile ms-green" />
                <span className="ms-tile ms-blue" />
                <span className="ms-tile ms-yellow" />
              </span>
              <span>{isMicrosoftLoading ? "Please wait..." : "Sign in with Microsoft"}</span>
            </button>
          ) : (
            isLoginView && msalDisabledReason && <p className="muted">{msalDisabledReason}</p>
          )}

          {error && <p className="error-text">{error}</p>}

          <button className="btn btn-primary btn-full" type="button" onClick={submitAuth} disabled={submitting}>
            {submitting ? "Working..." : viewCopy.primary}
          </button>

          <button
            className="auth-switch-link"
            type="button"
            onClick={() => switchView(isLoginView ? "register" : "login")}
          >
            {isLoginView ? "New here? Register now" : "Already registered? Login"}
          </button>
        </section>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="auth-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
