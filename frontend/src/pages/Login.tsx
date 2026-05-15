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

type AuthView = "landing" | "startOrg" | "orgLogin" | "userLogin" | "joinOrg";

const industries = ["Technology", "Finance", "Healthcare", "Education", "Retail", "Operations"];
const teamSizes = ["1-10", "11-50", "51-200", "201-1000", "1000+"];
const departments = ["Engineering", "Product", "Operations", "Finance", "People", "Sales"];

export default function Login({
  onAuthSuccess,
  onMicrosoftLogin,
  isMicrosoftLoading = false,
  msalEnabled = true,
  msalDisabledReason,
}: LoginProps) {
  const [view, setView] = useState<AuthView>("landing");
  const [name, setName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [industry, setIndustry] = useState(industries[0]);
  const [teamSize, setTeamSize] = useState(teamSizes[1]);
  const [department, setDepartment] = useState(departments[0]);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdOrgCode, setCreatedOrgCode] = useState("");
  const [pendingAuth, setPendingAuth] = useState<{ token: string; user: AppUser } | null>(null);

  const isLoginView = view === "orgLogin" || view === "userLogin";
  const viewCopy = useMemo(() => {
    switch (view) {
      case "startOrg":
        return {
          eyebrow: "Workspace setup",
          title: "Start your FlowTrack organization",
          subtitle: "Create a secure workspace for teams, departments, roles, and timesheets.",
          primary: "Create organization",
        };
      case "orgLogin":
        return {
          eyebrow: "Owner access",
          title: "Login as Organization",
          subtitle: "For founders, CEOs, managers, and workspace administrators.",
          primary: "Log In",
        };
      case "userLogin":
        return {
          eyebrow: "Employee access",
          title: "Login as User",
          subtitle: "Enter your Organization ID to access your company workspace.",
          primary: "Log In",
        };
      case "joinOrg":
        return {
          eyebrow: "Employee onboarding",
          title: "Join an organization",
          subtitle: "Use your Organization ID to create your employee account.",
          primary: "Join Workspace",
        };
      default:
        return {
          eyebrow: "Enterprise time operations",
          title: "FlowTrack",
          subtitle: "A multi-tenant workspace for teams, departments, timesheets, and approvals.",
          primary: "Get started",
        };
    }
  }, [view]);

  const resetFeedback = () => {
    setError("");
    setCreatedOrgCode("");
    setPendingAuth(null);
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

      const isStartOrg = view === "startOrg";
      const isJoinOrg = view === "joinOrg";
      if (isStartOrg && (!organizationName.trim() || !email.trim() || !password.trim())) {
        throw new Error("Organization name, company email and password are required.");
      }

      if (isLoginView && (!organizationId.trim() || !email.trim() || !password.trim())) {
        throw new Error("Organization ID, email and password are required.");
      }

      if (isJoinOrg && (!organizationId.trim() || !name.trim() || !email.trim() || !password.trim())) {
        throw new Error("Organization ID, full name, work email and password are required.");
      }

      const endpoint = isLoginView ? "login" : "register";
      const response = await fetch(`${API_BASE}/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isStartOrg
            ? {
                name: `${organizationName || "FlowTrack"} Owner`,
                email,
                password,
                organizationName,
                industry,
                teamSize,
              }
            : isJoinOrg
              ? {
                  name,
                  email,
                  password,
                  organizationId,
                  department,
                }
              : {
                  email,
                  password,
                  organizationId,
                },
        ),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Authentication failed.");
      }

      if (payload.organization?.orgCode) {
        setCreatedOrgCode(payload.organization.orgCode);
        setPendingAuth({ token: payload.token, user: payload.user });
        return;
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
      <div className="flow-auth-shell">
        <header className="flow-nav">
          <button className="brand-mark" type="button" onClick={() => switchView("landing")}>
            <span className="brand-icon">F</span>
            <span>FlowTrack</span>
          </button>
          <div className="flow-nav-actions">
            <button className="nav-link" type="button" onClick={() => switchView("orgLogin")}>
              Organization login
            </button>
            <button className="nav-link" type="button" onClick={() => switchView("userLogin")}>
              User login
            </button>
          </div>
        </header>

        <main className="flow-landing">
          <section className="hero-copy">
            <p className="flow-eyebrow">{viewCopy.eyebrow}</p>
            <h1>{viewCopy.title}</h1>
            <p className="hero-text">{viewCopy.subtitle}</p>
            <div className="hero-actions">
              <button className="btn btn-primary" type="button" onClick={() => switchView("startOrg")}>
                Start Organization
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => switchView("orgLogin")}>
                Login as Organization
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => switchView("userLogin")}>
                Login as User
              </button>
            </div>
          </section>

          <section className="product-preview" aria-label="FlowTrack dashboard preview">
            <div className="preview-toolbar">
              <span />
              <span />
              <span />
              <strong>Workspace command center</strong>
            </div>
            <div className="preview-grid">
              <div className="metric-panel">
                <p>Departments</p>
                <strong>08</strong>
              </div>
              <div className="metric-panel">
                <p>Approval queue</p>
                <strong>24</strong>
              </div>
              <div className="metric-panel">
                <p>Billable hours</p>
                <strong>1,284</strong>
              </div>
            </div>
            <div className="timeline-panel">
              <div className="timeline-row wide" />
              <div className="timeline-row medium" />
              <div className="timeline-row short" />
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="flow-auth-shell">
      <header className="flow-nav">
        <button className="brand-mark" type="button" onClick={() => switchView("landing")}>
          <span className="brand-icon">F</span>
          <span>FlowTrack</span>
        </button>
        <button className="nav-link" type="button" onClick={() => switchView("landing")}>
          Back to overview
        </button>
      </header>

      <main className="auth-experience">
        <section className="workspace-visual" aria-label="Workspace illustration">
          <p className="flow-eyebrow">Multi-tenant SaaS</p>
          <h2>One workspace for every team, role, and approval path.</h2>
          <div className="org-map">
            <div className="org-node primary">CEO</div>
            <div className="org-branch">
              <span>Engineering</span>
              <span>Finance</span>
              <span>Operations</span>
            </div>
            <div className="access-row">
              <span>RBAC ready</span>
              <span>Departments</span>
              <span>JWT sessions</span>
            </div>
          </div>
        </section>

        <section className="auth-card-pro">
          <div className="auth-mode-tabs" aria-label="FlowTrack authentication pages">
            <button
              type="button"
              className={view === "orgLogin" ? "active" : ""}
              onClick={() => switchView("orgLogin")}
            >
              Organization Login
            </button>
            <button
              type="button"
              className={view === "userLogin" ? "active" : ""}
              onClick={() => switchView("userLogin")}
            >
              User Login
            </button>
            <button
              type="button"
              className={view === "startOrg" ? "active" : ""}
              onClick={() => switchView("startOrg")}
            >
              Start Organization
            </button>
            <button
              type="button"
              className={view === "joinOrg" ? "active" : ""}
              onClick={() => switchView("joinOrg")}
            >
              Join
            </button>
          </div>

          <div className="progress-steps" aria-label="Authentication flow steps">
            <span className="active" />
            <span className={view === "startOrg" || view === "joinOrg" ? "active" : ""} />
            <span className={isLoginView ? "active" : ""} />
          </div>

          <p className="flow-eyebrow">{viewCopy.eyebrow}</p>
          <h1>{viewCopy.title}</h1>
          <p className="auth-subtitle">{viewCopy.subtitle}</p>

          {createdOrgCode && (
            <div className="success-banner">
              Organization ID generated: <strong>{createdOrgCode}</strong>
            </div>
          )}

          <div className="form-grid">
            {view === "startOrg" && (
              <>
                <Field label="Organization Name">
                  <input
                    className="auth-input"
                    value={organizationName}
                    onChange={(event) => setOrganizationName(event.target.value)}
                    placeholder="Acme Operations"
                  />
                </Field>
                <Field label="Company Email">
                  <input
                    className="auth-input"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="ceo@company.com"
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
                <Field label="Industry">
                  <select className="auth-input" value={industry} onChange={(event) => setIndustry(event.target.value)}>
                    {industries.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Team Size">
                  <select className="auth-input" value={teamSize} onChange={(event) => setTeamSize(event.target.value)}>
                    {teamSizes.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </Field>
              </>
            )}

            {isLoginView && (
              <>
                <Field label="Organization ID">
                  <input
                    className="auth-input"
                    value={organizationId}
                    onChange={(event) => setOrganizationId(event.target.value)}
                    placeholder="ORG-X82KLM"
                  />
                </Field>
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

            {view === "joinOrg" && (
              <>
                <Field label="Organization ID">
                  <input
                    className="auth-input"
                    value={organizationId}
                    onChange={(event) => setOrganizationId(event.target.value)}
                    placeholder="ORG-X82KLM"
                  />
                </Field>
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
                <Field label="Department">
                  <select className="auth-input" value={department} onChange={(event) => setDepartment(event.target.value)}>
                    {departments.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
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

          {(isLoginView || view === "startOrg") && (
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

          {!pendingAuth && (
            <button className="btn btn-primary btn-full" type="button" onClick={submitAuth} disabled={submitting}>
              {submitting ? "Working..." : viewCopy.primary}
            </button>
          )}

          {pendingAuth && (
            <button
              className="btn btn-secondary btn-full"
              type="button"
              onClick={() => onAuthSuccess(pendingAuth.token, pendingAuth.user)}
            >
              Enter workspace
            </button>
          )}

          <div className="auth-switcher">
            <button type="button" className="link-button" onClick={() => switchView("startOrg")}>
              Start Organization
            </button>
            <button type="button" className="link-button" onClick={() => switchView("orgLogin")}>
              Login as Organization
            </button>
            <button type="button" className="link-button" onClick={() => switchView("userLogin")}>
              Login as User
            </button>
            <button type="button" className="link-button" onClick={() => switchView("joinOrg")}>
              Join Organization
            </button>
          </div>
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
