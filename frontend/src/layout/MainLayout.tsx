function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header style={{ padding: 10, background: "#eee" }}>Timesheet App</header>

      <main>{children}</main>
    </div>
  );
}

export default MainLayout;
