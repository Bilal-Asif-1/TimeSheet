import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../auth/authConfig";

export default function Login() {
  const { instance, inProgress } = useMsal();

  const handleLogin = async () => {
    try {
      // Redirect flow is more reliable for beginners and avoids nested popup errors.
      await instance.loginRedirect(loginRequest);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: "100px" }}>
      <div>
        <h2>Timesheet App</h2>

        <button
          onClick={handleLogin}
          disabled={inProgress !== "none"}
          style={{
            padding: "10px 20px",
            backgroundColor: "#0078D4",
            color: "white",
            border: "none",
            cursor: "pointer",
            borderRadius: "6px",
            opacity: inProgress !== "none" ? 0.7 : 1,
          }}
        >
          {inProgress !== "none" ? "Please wait..." : "Login with Microsoft"}
        </button>
      </div>
    </div>
  );
}