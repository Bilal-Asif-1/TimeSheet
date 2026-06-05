import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { MsalProvider } from "@azure/msal-react";
import { msalEnabled, msalInstance } from "./auth/authConfig";
import "./index.css";

// HTML ke #root element ko React application ka root banaya ja raha hai.
const root = ReactDOM.createRoot(document.getElementById("root")!);

// Local HTTPS/localhost par Microsoft auth available ho to MSAL provider use hoga.
if (msalEnabled && msalInstance) {
  root.render(
    <BrowserRouter>
      <MsalProvider instance={msalInstance}>
        <App msalEnabled />
      </MsalProvider>
    </BrowserRouter>,
  );
} else {
  // EC2 ke local-only mode mein app Microsoft provider ke baghair chalegi.
  root.render(
    <BrowserRouter>
      <App msalEnabled={false} />
    </BrowserRouter>,
  );
}
