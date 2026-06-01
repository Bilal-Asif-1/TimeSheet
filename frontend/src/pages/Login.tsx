import { useMemo, useState } from "react";
import { getApiError } from "../api/apiError";
import { api } from "../api/http";
import AuthField from "./auth/AuthField";
import LandingView from "./auth/LandingView";

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
type AuthResponse = {
  token: string;
  user: AppUser;
};

const inputClass =
  "min-h-11 rounded-xl border border-white/15 bg-white/10 px-3.5 py-3 text-[15px] text-white outline-none placeholder:text-gray-400 focus:border-white/70 focus:ring-4 focus:ring-white/10";
const authShellClass =
  "min-h-screen overflow-auto bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.14),transparent_24%),radial-gradient(circle_at_84%_20%,rgba(255,255,255,0.1),transparent_26%),linear-gradient(135deg,#050505_0%,#111111_42%,#1f2937_100%)] text-slate-50";
const cardClass =
  "relative w-full self-center rounded-[28px] border border-white/15 bg-[radial-gradient(circle_at_82%_8%,rgba(255,255,255,0.12),transparent_28%),linear-gradient(145deg,rgba(8,8,8,0.94),rgba(31,41,55,0.9))] p-7 text-slate-50 shadow-[0_30px_80px_rgba(0,0,0,0.46)]";

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
      const response = await api.post<AuthResponse>(
        `/auth/${endpoint}`,
          view === "register"
            ? { name, email, password }
            : { email, password },
      );

      onAuthSuccess(response.data.token, response.data.user);
    } catch (authError) {
      setError(getApiError(authError, "Authentication failed."));
    } finally {
      setSubmitting(false);
    }
  };

  if (view === "landing") {
    return (
      <LandingView
        eyebrow={viewCopy.eyebrow}
        title={viewCopy.title}
        subtitle={viewCopy.subtitle}
        onLogin={() => switchView("login")}
        onRegister={() => switchView("register")}
      />
    );
  }

  return (
    <div className={authShellClass}>
      <main className="mx-auto flex min-h-screen max-w-[720px] items-center justify-center p-6">
        <section className={`${cardClass}${view === "register" ? " max-w-[560px] p-6" : ""}`}>
          <button
            className="mb-3 grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/10 text-xl text-white transition hover:-translate-x-0.5 hover:bg-white/15"
            type="button"
            onClick={() => switchView("landing")}
            aria-label="Back to landing"
          >
            ←
          </button>
          <div className="mb-3.5 inline-block bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-[28px] font-black tracking-normal text-transparent">
            TimeSheet
          </div>
          <p className="mb-3 text-xs font-extrabold uppercase tracking-normal text-slate-300">{viewCopy.eyebrow}</p>
          <h1 className={`${view === "register" ? "text-[31px]" : "text-[34px]"} mb-2 font-extrabold leading-tight text-white`}>
            {viewCopy.title}
          </h1>
          <p className={`${view === "register" ? "mb-4 text-sm" : "mb-[18px]"} leading-[1.45] text-slate-300`}>
            {viewCopy.subtitle}
          </p>

          <div className={`grid ${view === "register" ? "gap-[11px]" : "gap-3"}`}>
            {isLoginView && (
              <>
                <AuthField label="Username or Email Address">
                  <input
                    className={inputClass}
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@company.com"
                  />
                </AuthField>
                <AuthField label="Password">
                  <input
                    className={inputClass}
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter password"
                  />
                </AuthField>
              </>
            )}

            {view === "register" && (
              <>
                <AuthField label="Full Name">
                  <input
                    className={inputClass}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="John Doe"
                  />
                </AuthField>
                <AuthField label="Work Email">
                  <input
                    className={inputClass}
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@company.com"
                  />
                </AuthField>
                <AuthField label="Password">
                  <input
                    className={inputClass}
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Create password"
                  />
                </AuthField>
              </>
            )}
          </div>

          {isLoginView && (
            <label className="my-3.5 flex items-center justify-start gap-3 text-sm font-bold text-slate-200">
              <input
                className="h-[22px] w-[22px]"
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <span>Remember Me</span>
            </label>
          )}

          {msalEnabled && isLoginView ? (
            <button
              className="mb-3 flex min-h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-white/20 bg-zinc-700 px-5 text-[15px] font-extrabold text-slate-50 transition hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              onClick={handleMicrosoftLogin}
              disabled={isMicrosoftLoading}
            >
              <span className="grid size-4 grid-cols-2 gap-0.5" aria-hidden="true">
                <span className="bg-[#f25022]" />
                <span className="bg-[#7fba00]" />
                <span className="bg-[#00a4ef]" />
                <span className="bg-[#ffb900]" />
              </span>
              <span>{isMicrosoftLoading ? "Please wait..." : "Sign in with Microsoft"}</span>
            </button>
          ) : (
            isLoginView && msalDisabledReason && <p className="text-sm text-slate-400">{msalDisabledReason}</p>
          )}

          {error && <p className="my-3 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-200">{error}</p>}

          <button
            className={`${view === "register" ? "mt-3" : ""} min-h-11 w-full rounded-xl bg-zinc-600 px-5 font-extrabold text-white transition hover:bg-zinc-500 disabled:cursor-not-allowed disabled:opacity-60`}
            type="button"
            onClick={submitAuth}
            disabled={submitting}
          >
            {submitting ? "Working..." : viewCopy.primary}
          </button>

          <button
            className="mt-3 w-full border-0 bg-transparent text-sm font-extrabold text-zinc-300 transition hover:text-white"
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
