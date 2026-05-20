import type { ReactNode } from "react";
import type { WorkspacePage } from "./types";
import { workspacePages } from "./utils";

type Props = {
  activePage: WorkspacePage;
  children: ReactNode;
  hasOrganization: boolean;
  isOrganizationArea: boolean;
  onPageChange: (page: WorkspacePage) => void;
  showOrganizationTopNav: boolean;
  user: { name: string; email: string };
};

export function DashboardLayout({
  activePage,
  children,
  hasOrganization,
  isOrganizationArea,
  onPageChange,
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
              <button className={activePage === page.id ? "active" : ""} key={page.id} onClick={() => onPageChange(page.id)} type="button">
                {page.label}
              </button>
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
