import { useMsal } from "@azure/msal-react";
import { useState } from "react";
import { loginRequest } from "../auth/authConfig";

const API_BASE = "http://localhost:5001";

type LoginProps = {
  onAuthSuccess: (
    token: string,
    user: { id: number; name: string; email: string; provider: "local" | "microsoft" },
  ) => void;
};

export default function Login({ onAuthSuccess }: LoginProps) {
  const { instance, inProgress } = useMsal();
  const isLoading = inProgress !== "none";
  const [mode, setMode] = useState<"landing" | "login" | "register">("landing");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    try {
      // Redirect flow is more reliable for beginners and avoids nested popup errors.
      await instance.loginRedirect(loginRequest);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLocalAuth = async (target: "login" | "register") => {
    try {
      setError("");
      setSubmitting(true);

      const response = await fetch(`${API_BASE}/auth/${target}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          target === "register" ? { name, email, password } : { email, password },
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

  return (
    <div className="auth-page">
      <div className="auth-wrapper">
        <div className="auth-panel">
          <h2 className="auth-title">
            {mode === "register" ? "Create your account" : "Username or Email Address"}
          </h2>
          {mode === "register" && (
            <>
              <label className="auth-label">Full Name</label>
              <input
                className="auth-input"
                id="full-name"
                name="fullName"
                autoComplete="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </>
          )}

          <label className="auth-label">
            {mode === "register" ? "Email Address" : "Username or Email Address"}
          </label>
          <input
            className="auth-input"
            id="email"
            name="email"
            autoComplete="email"
            placeholder="name@example.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="auth-label">Password</label>
          <input
            className="auth-input"
            id="password"
            name="password"
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            placeholder="Enter password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <p className="or-text">Or</p>

          <button className="btn ms-btn" onClick={handleLogin} disabled={isLoading}>
            {isLoading ? (
              "Please wait..."
            ) : (
              <>
                <span className="ms-logo" aria-hidden="true">
                  <span className="ms-tile ms-red" />
                  <span className="ms-tile ms-green" />
                  <span className="ms-tile ms-blue" />
                  <span className="ms-tile ms-yellow" />
                </span>
                <span>Sign in with Microsoft</span>
              </>
            )}
          </button>

          {error && <p className="error-text">{error}</p>}

          <div className="auth-bottom-row">
            <label className="remember-row">
              <input
                type="checkbox"
                id="remember-me"
                name="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember Me</span>
            </label>

            <button
              className="btn btn-primary"
              onClick={() => handleLocalAuth(mode === "register" ? "register" : "login")}
              disabled={submitting}
            >
              {submitting
                ? mode === "register"
                  ? "Registering..."
                  : "Logging in..."
                : mode === "register"
                  ? "Register"
                  : "Log In"}
            </button>
          </div>
        </div>

        <div className="auth-links">
          {mode === "register" ? (
            <button className="link-button" onClick={() => setMode("login")}>
              Already have account? Log In
            </button>
          ) : (
            <button className="link-button" onClick={() => setMode("register")}>
              Register first
            </button>
          )}
        </div>
      </div>
    </div>
  );
}