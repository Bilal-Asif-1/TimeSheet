import { useMsal } from "@azure/msal-react";
import { useEffect, useState } from "react";
import { loginRequest, msalDisabledReason } from "./auth/authConfig";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import MainLayout from "./layout/MainLayout";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";
const APP_ORIGIN = import.meta.env.VITE_APP_ORIGIN || "http://localhost:5173";

type AppUser = {
  id: number;
  name: string;
  email: string;
  provider: "local" | "microsoft";
};

type AppProps = {
  msalEnabled?: boolean;
};

function AppWithMsal() {
  const { accounts, instance, inProgress } = useMsal();
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("appToken"));
  const [user, setUser] = useState<AppUser | null>(() => {
    const raw = localStorage.getItem("appUser");
    return raw ? (JSON.parse(raw) as AppUser) : null;
  });
  const [syncingMicrosoft, setSyncingMicrosoft] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    // When MSAL account exists, exchange Microsoft token for our own app JWT.
    const syncMicrosoftUser = async () => {
      if (accounts.length === 0 || token) {
        return;
      }

      try {
        setSyncingMicrosoft(true);
        const response = await instance.acquireTokenSilent({
          scopes: loginRequest.scopes,
          account: accounts[0],
        });

        const syncRes = await fetch(`${API_BASE}/auth/microsoft/sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${response.idToken}`,
          },
        });

        if (!syncRes.ok) {
          throw new Error("Failed to sync Microsoft user.");
        }

        const payload = await syncRes.json();
        localStorage.setItem("appToken", payload.token);
        localStorage.setItem("appUser", JSON.stringify(payload.user));
        setToken(payload.token);
        setUser(payload.user);
      } catch (error) {
        console.error("Microsoft sync failed:", error);
      } finally {
        setSyncingMicrosoft(false);
      }
    };

    syncMicrosoftUser();
  }, [accounts, instance, token]);

  const handleLogout = async () => {
    if (loggingOut) return;

    try {
      setLoggingOut(true);
      const hasMicrosoftSession = accounts.length > 0 || user?.provider === "microsoft";

      // Always clear local app session first so UI logs out immediately.
      localStorage.removeItem("appToken");
      localStorage.removeItem("appUser");
      setToken(null);
      setUser(null);

      // End Microsoft session too when account exists.
      if (hasMicrosoftSession) {
        await instance.logoutRedirect({
          account: accounts[0],
          postLogoutRedirectUri: APP_ORIGIN,
        });
        return;
      }

      // Local auth users should also land back on login screen immediately.
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
      // Fallback: still bring user to login UI even if Microsoft logout throws.
      window.location.href = "/";
    } finally {
      setLoggingOut(false);
    }
  };

  const handleLocalAuthSuccess = (nextToken: string, nextUser: AppUser) => {
    localStorage.setItem("appToken", nextToken);
    localStorage.setItem("appUser", JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  };

  const isLoggedIn = Boolean(token && user);
  const accountName = user?.name ?? accounts[0]?.name ?? "User";

  if (inProgress !== "none" || syncingMicrosoft || loggingOut) {
    return (
      <div className="auth-page">
        <div className="card auth-card">
          <p className="eyebrow">Please wait</p>
          <h1>{loggingOut ? "Signing you out..." : "Signing you in..."}</h1>
          <p className="muted">
            {loggingOut
              ? "We are ending your current session."
              : "We are finishing your authentication."}
          </p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <Login
        onAuthSuccess={handleLocalAuthSuccess}
        onMicrosoftLogin={() => instance.loginRedirect(loginRequest)}
        isMicrosoftLoading={inProgress !== "none"}
        msalEnabled
      />
    );
  }

  return (
    <MainLayout userName={accountName} onLogout={handleLogout} isLoggingOut={loggingOut}>
      <Dashboard token={token!} user={user!} />
    </MainLayout>
  );
}

function AppLocalOnly() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("appToken"));
  const [user, setUser] = useState<AppUser | null>(() => {
    const raw = localStorage.getItem("appUser");
    return raw ? (JSON.parse(raw) as AppUser) : null;
  });
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    localStorage.removeItem("appToken");
    localStorage.removeItem("appUser");
    setToken(null);
    setUser(null);
    setLoggingOut(false);
  };

  const handleLocalAuthSuccess = (nextToken: string, nextUser: AppUser) => {
    localStorage.setItem("appToken", nextToken);
    localStorage.setItem("appUser", JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  };

  if (loggingOut) {
    return (
      <div className="auth-page">
        <div className="card auth-card">
          <p className="eyebrow">Please wait</p>
          <h1>Signing you out...</h1>
          <p className="muted">We are ending your current session.</p>
        </div>
      </div>
    );
  }

  const isLoggedIn = Boolean(token && user);
  if (!isLoggedIn) {
    return (
      <Login
        onAuthSuccess={handleLocalAuthSuccess}
        msalEnabled={false}
        msalDisabledReason={msalDisabledReason}
      />
    );
  }

  return (
    <MainLayout userName={user!.name} onLogout={handleLogout} isLoggingOut={loggingOut}>
      <Dashboard token={token!} user={user!} />
    </MainLayout>
  );
}

export default function App({ msalEnabled = true }: AppProps) {
  return msalEnabled ? <AppWithMsal /> : <AppLocalOnly />;
}
