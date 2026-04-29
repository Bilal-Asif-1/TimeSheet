import { useMsal } from "@azure/msal-react";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";

export default function App() {
  const { accounts } = useMsal();

  const isLoggedIn = accounts.length > 0;

  return <div>{isLoggedIn ? <Dashboard /> : <Login />}</div>;
}
