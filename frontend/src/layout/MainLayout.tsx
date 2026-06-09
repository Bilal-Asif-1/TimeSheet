type MainLayoutProps = {
  children: React.ReactNode;
  userName: string;
  onLogout: () => Promise<void>;
  isLoggingOut: boolean;
};

function MainLayout({ children, userName, onLogout, isLoggingOut }: MainLayoutProps) {
  // Ye outer logged-in layout top navbar ke neeche dashboard ko render karta hai.
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="fixed left-1/2 top-4 z-40 flex w-[min(1280px,calc(100%-32px))] -translate-x-1/2 items-center justify-between rounded-[28px] border border-white/10 bg-zinc-900/90 px-5 py-4 shadow-[0_20px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <h2 className="bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-2xl font-black text-transparent">TimeSheet</h2>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white/75">{userName}</span>
            <button
              className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              onClick={onLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
        </div>
      </header>
      <main className="mx-auto w-[min(1280px,calc(100%-32px))] pb-10 pt-28">{children}</main>
    </div>
  );
}

export default MainLayout;
