import { useMsal } from "@azure/msal-react";

export default function Login() {
  const { instance } = useMsal();

  const login = async () => {
    try {
      await instance.loginPopup({
        scopes: ["User.Read"],
      });
    } catch (e) {
      console.error(e);
    }
  };

  return <button onClick={() => login()}>Login with Microsoft</button>;
}
