import type { WorkspacePage } from "./types";

type Props = {
  activePage: WorkspacePage;
  hasOrganization: boolean;
  onPageChange: (page: WorkspacePage) => void;
};

export function OrganizationTopNav({ activePage, hasOrganization, onPageChange }: Props) {
  const homeLabel = activePage === "myOrganization" || activePage === "createOrganization" ? "Organizations" : "Home";

  return (
    <div className="organization-top-nav">
      <button className={activePage === "organizationDetails" ? "active" : ""} onClick={() => onPageChange(hasOrganization ? "organizationDetails" : "myOrganization")} type="button">
        {homeLabel}
      </button>
      <button className={activePage === "employees" ? "active" : ""} disabled={!hasOrganization} onClick={() => onPageChange("employees")} type="button">
        Employees
      </button>
      <button className={activePage === "departments" ? "active" : ""} disabled={!hasOrganization} onClick={() => onPageChange("departments")} type="button">
        Departments
      </button>
      {(activePage === "myOrganization" || activePage === "createOrganization") && (
        <button className={`organization-create-nav-button${activePage === "createOrganization" ? " active" : ""}`} onClick={() => onPageChange("createOrganization")} type="button">
          Create Organization
        </button>
      )}
      <button className="organization-exit-button" onClick={() => onPageChange("overview")} type="button">
        Back to Dashboard
      </button>
    </div>
  );
}
