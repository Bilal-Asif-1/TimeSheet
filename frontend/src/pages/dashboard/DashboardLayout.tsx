import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import type { WorkspacePage } from "./types";
import { pageToPath, workspacePages } from "./utils";

type Props = {
  activePage: WorkspacePage;
  children: ReactNode;
  hasOrganization: boolean;
  isOrganizationArea: boolean;
  showOrganizationTopNav: boolean;
  user: { name: string; email: string };
};

const cardGradient =
  "bg-[radial-gradient(circle_at_80%_8%,rgba(255,255,255,0.12),transparent_26%),linear-gradient(160deg,rgba(8,8,8,0.96),rgba(31,41,55,0.92))]";

export function DashboardLayout({
  activePage,
  children,
  isOrganizationArea,
  showOrganizationTopNav,
  user,
}: Props) {
  // Organization ke andar sidebar hide hoti hai; normal dashboard par fixed sidebar rehti hai.
  const shellClass = isOrganizationArea ? "block pl-0" : "block pl-[240px]";
  const sidebarClass =
    `fixed left-[max(24px,calc((100vw-1280px)/2))] top-28 z-20 flex min-h-[calc(100vh-148px)] max-h-[calc(100vh-148px)] w-[220px] flex-col gap-3.5 rounded-[22px] border border-white/10 p-4 text-white shadow-[0_24px_70px_rgba(0,0,0,0.36)] ${cardGradient}`;
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex min-h-9 items-center rounded-[11px] border px-2.5 text-left text-[13px] font-extrabold no-underline ${
      isActive
        ? "border-white/10 bg-white/10 text-white"
        : "border-transparent bg-transparent text-zinc-400 hover:border-white/10 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <div className={shellClass}>
      {!isOrganizationArea && (
        <aside className={sidebarClass}>
          <div className="bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-[21px] font-black text-transparent">Workspace</div>
          <nav className="grid gap-1.5" aria-label="Workspace sections">
            {/* Central workspacePages list se sidebar links automatically bante hain. */}
            {workspacePages.map((page) => (
              <NavLink className={linkClass} end={page.id === "overview"} key={page.id} to={pageToPath(page.id)}>
                {page.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto grid gap-1 rounded-[14px] border border-white/10 bg-white/[0.06] p-3">
            <strong>{user.name}</strong>
            <small className="text-xs text-zinc-400">{user.email}</small>
          </div>
        </aside>
      )}

      <div className={`flex flex-col gap-4 text-slate-50${activePage === "overview" ? " overview-page gap-3" : ""}`}>
        {showOrganizationTopNav && children}
        {!showOrganizationTopNav && children}
      </div>
    </div>
  );
}
