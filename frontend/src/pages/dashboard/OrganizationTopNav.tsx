import { NavLink } from "react-router-dom";
import type { WorkspacePage } from "./types";
import { pageToPath } from "./utils";

type Props = {
  activePage: WorkspacePage;
  hasOrganization: boolean;
};

export function OrganizationTopNav({ activePage, hasOrganization }: Props) {
  const homeLabel = activePage === "myOrganization" || activePage === "createOrganization" ? "Organizations" : "Home";
  const homePath = hasOrganization ? pageToPath("organizationDetails") : pageToPath("myOrganization");

  return (
    <div className="organization-top-nav">
      <NavLink className={({ isActive }) => (isActive ? "active" : "")} to={homePath}>
        {homeLabel}
      </NavLink>
      {hasOrganization ? (
        <>
          <NavLink className={({ isActive }) => (isActive ? "active" : "")} to={pageToPath("employees")}>Employees</NavLink>
          <NavLink className={({ isActive }) => (isActive ? "active" : "")} to={pageToPath("departments")}>Departments</NavLink>
        </>
      ) : (
        <>
          <span className="disabled-nav-link">Employees</span>
          <span className="disabled-nav-link">Departments</span>
        </>
      )}
      {(activePage === "myOrganization" || activePage === "createOrganization") && (
        <NavLink className={({ isActive }) => `organization-create-nav-button${isActive ? " active" : ""}`} to={pageToPath("createOrganization")}>
          Create Organization
        </NavLink>
      )}
      <NavLink className="organization-exit-button" to={pageToPath("overview")}>
        Back to Dashboard
      </NavLink>
    </div>
  );
}
