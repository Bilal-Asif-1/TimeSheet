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

export function DashboardLayout({
  activePage,
  children,
  hasOrganization,
  isOrganizationArea,
  showOrganizationTopNav,
  user,
}: Props) {
  return (
    <div className={`workspace-shell${hasOrganization ? "" : " no-organization-shell"}${isOrganizationArea ? " organization-area-shell" : ""}`}>
      {!isOrganizationArea && (
        <aside className="workspace-sidebar">
          <div className="sidebar-brand">Workspace</div>
          <nav className="sidebar-nav" aria-label="Workspace sections">
            {workspacePages.map((page) => (
              <NavLink className={({ isActive }) => (isActive ? "active" : "")} end={page.id === "overview"} key={page.id} to={pageToPath(page.id)}>
                {page.label}
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-profile">
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </div>
        </aside>
      )}

      <div className={`dashboard-wrap workspace-dashboard${activePage === "overview" ? " overview-page" : ""}`}>
        {showOrganizationTopNav && children}
        {!showOrganizationTopNav && children}
      </div>
    </div>
  );
}
