import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { MsalProvider } from "@azure/msal-react";
import { msalEnabled, msalInstance } from "./auth/authConfig";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root")!);

if (msalEnabled && msalInstance) {
  root.render(
    <BrowserRouter>
      <MsalProvider instance={msalInstance}>
        <App msalEnabled />
      </MsalProvider>
    </BrowserRouter>,
  );
} else {
  root.render(
    <BrowserRouter>
      <App msalEnabled={false} />
    </BrowserRouter>,
  );
}
