import ReactDOM from "react-dom/client";
import App from "./App";
import { MsalProvider } from "@azure/msal-react";
import { msalEnabled, msalInstance } from "./auth/authConfig";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root")!);

if (msalEnabled && msalInstance) {
  root.render(
    <MsalProvider instance={msalInstance}>
      <App msalEnabled />
    </MsalProvider>,
  );
} else {
  root.render(<App msalEnabled={false} />);
}
