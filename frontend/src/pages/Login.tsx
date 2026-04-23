type Props = {
  onLogin: () => void;
};

function Login({ onLogin }: Props) {
  return (
    <div style={{ padding: 20 }}>
      <h2>Login Page</h2>

      <button onClick={onLogin}>Login (Mock)</button>
    </div>
  );
}

export default Login;
