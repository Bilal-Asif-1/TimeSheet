type Props = {
  onLogin: () => void;
};

function Login({ onLogin }: Props) {
  return (
    <div style={{ padding: 20 }}>
      <h2>Login (Demo Mode)</h2>

      <button onClick={onLogin}>Enter Dashboard</button>
    </div>
  );
}

export default Login;
