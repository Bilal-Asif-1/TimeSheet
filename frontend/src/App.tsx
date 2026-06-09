import { useMsal } from "@azure/msal-react";
import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { getApiError } from "./api/apiError";
import { api } from "./api/http";
import { loginRequest, msalDisabledReason } from "./auth/authConfig";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import MainLayout from "./layout/MainLayout";
import { getAppOrigin } from "./config/env";

const APP_ORIGIN = getAppOrigin();

// Login ke baad frontend ko backend se isi shape ka user milta hai.
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

type AppProps = {
  msalEnabled?: boolean;
};

type AuthResponse = {
  token: string;
  user: AppUser;
};

function AppWithMsal() {
  // Ye component local login aur Microsoft login dono ko support karta hai.
  const { accounts, instance, inProgress } = useMsal();
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("appToken"));
  const [user, setUser] = useState<AppUser | null>(() => {
    const raw = localStorage.getItem("appUser");
    return raw ? (JSON.parse(raw) as AppUser) : null;
  });
  const [syncingMicrosoft, setSyncingMicrosoft] = useState(false);
  const [microsoftError, setMicrosoftError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    // Microsoft login ke token ko backend ke apne JWT token mein badla jata hai.
    const syncMicrosoftUser = async () => {
      if (accounts.length === 0 || token) {
        return;
      }

      try {
        setSyncingMicrosoft(true);
        setMicrosoftError("");
        const response = await instance.acquireTokenSilent({
          scopes: loginRequest.scopes,
          account: accounts[0],
          forceRefresh: true,
        });

        if (!response.idToken) {
          throw new Error("Microsoft did not return an ID token.");
        }

        const syncRes = await api.post<AuthResponse>(
          "/auth/microsoft/sync",
          undefined,
          {
            headers: {
              Authorization: `Bearer ${response.idToken}`,
            },
          },
        );

        const payload = syncRes.data;
        localStorage.setItem("appToken", payload.token);
        localStorage.setItem("appUser", JSON.stringify(payload.user));
        setToken(payload.token);
        setUser(payload.user);
        navigate("/dashboard", { replace: true });
      } catch (error) {
        console.error("Microsoft sync failed:", error);
        setMicrosoftError(
          getApiError(error, "Microsoft sign-in completed, but the application session could not be created."),
        );
      } finally {
        setSyncingMicrosoft(false);
      }
    };

    syncMicrosoftUser();
  }, [accounts, instance, navigate, token]);

  const handleLogout = async () => {
    if (loggingOut) return;

    try {
      setLoggingOut(true);
      const hasMicrosoftSession = accounts.length > 0 || user?.provider === "microsoft";

      // Pehle local session clear hota hai taake UI foran logout ho jaye.
      localStorage.removeItem("appToken");
      localStorage.removeItem("appUser");
      setToken(null);
      setUser(null);

      // Microsoft account use hua ho to Microsoft ki session bhi close hoti hai.
      if (hasMicrosoftSession) {
        await instance.logoutRedirect({
          account: accounts[0],
          postLogoutRedirectUri: APP_ORIGIN,
        });
        return;
      }

      // Local user ko seedha login page par wapas bheja jata hai.
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
      // Microsoft logout fail ho tab bhi user ko login screen par le aate hain.
      navigate("/", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  const handleLocalAuthSuccess = (nextToken: string, nextUser: AppUser) => {
    // Successful login/register ke baad token aur user browser mein save hote hain.
    localStorage.setItem("appToken", nextToken);
    localStorage.setItem("appUser", JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
    navigate("/dashboard", { replace: true });
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
    // Token ya user na ho to sirf login/registration screen dikhai jati hai.
    return (
      <Routes>
        <Route
          path="*"
          element={
            <Login
              onAuthSuccess={handleLocalAuthSuccess}
              onMicrosoftLogin={() => instance.loginRedirect(loginRequest)}
              isMicrosoftLoading={inProgress !== "none"}
              msalEnabled
              externalError={microsoftError}
            />
          }
        />
      </Routes>
    );
  }

  // Logged-in user ke liye dashboard protected route par render hota hai.
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/dashboard/*"
        element={
          <MainLayout userName={accountName} onLogout={handleLogout} isLoggingOut={loggingOut}>
            <Dashboard token={token!} user={user!} />
          </MainLayout>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function AppLocalOnly() {
  // Ye version Microsoft auth ke baghair sirf email/password login chalata hai.
  const navigate = useNavigate();
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
    navigate("/", { replace: true });
  };

  const handleLocalAuthSuccess = (nextToken: string, nextUser: AppUser) => {
    // Local auth response ko save karke dashboard open kiya jata hai.
    localStorage.setItem("appToken", nextToken);
    localStorage.setItem("appUser", JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
    navigate("/dashboard", { replace: true });
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
      <Routes>
        <Route
          path="*"
          element={
            <Login
              onAuthSuccess={handleLocalAuthSuccess}
              msalEnabled={false}
              msalDisabledReason={msalDisabledReason}
            />
          }
        />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/dashboard/*"
        element={
          <MainLayout userName={user!.name} onLogout={handleLogout} isLoggingOut={loggingOut}>
            <Dashboard token={token!} user={user!} />
          </MainLayout>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App({ msalEnabled = true }: AppProps) {
  // Environment ke auth mode ke mutabiq sahi app version select hota hai.
  return msalEnabled ? <AppWithMsal /> : <AppLocalOnly />;
}
