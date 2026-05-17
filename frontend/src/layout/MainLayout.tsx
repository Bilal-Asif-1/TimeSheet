type MainLayoutProps = {
  children: React.ReactNode;
  userName: string;
  onLogout: () => Promise<void>;
  isLoggingOut: boolean;
};

function MainLayout({ children, userName, onLogout, isLoggingOut }: MainLayoutProps) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="container topbar-inner">
          <h2>TimeSheet</h2>
          <div className="topbar-actions">
            <span className="user-chip">{userName}</span>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={onLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </header>
      <main className="container main-content">{children}</main>
    </div>
  );
}

export default MainLayout;
