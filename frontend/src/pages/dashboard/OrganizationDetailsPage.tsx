import { InfoTile, KpiCard } from "./components";
import type { DashboardController } from "./controllerType";
import { formatRole } from "./utils";

type Props = { dashboard: DashboardController };

export function OrganizationDetailsPage({ dashboard }: Props) {
  const { overview, user } = dashboard;
  const organization = overview.organization;
  if (!organization) return null;

  return (
    <section className="organization-details-page">
      <section className="workspace-hero-panel organization-detail-hero">
        <div>
          <p className="eyebrow">Workspace Profile</p>
          <h1>{organization.name}</h1>
          <p className="workspace-hero-copy">Organization ID {organization.orgCode} - {organization.industry || "Operations"} workspace</p>
        </div>
        <div className="workspace-hero-meta">
          <span>{formatRole(user.role)}</span>
          <strong>{user.name}</strong>
          <small>{user.email}</small>
        </div>
      </section>

      <section className="dashboard-kpi-grid">
        <KpiCard label="Employees" note="Workspace users" tone="info" value={overview.stats.employees} />
        <KpiCard label="Departments" note="Company structure" tone="warning" value={overview.stats.departments} />
        <KpiCard label="Org Hours" note="Logged by members" tone="neutral" value={overview.stats.totalHours} />
        <KpiCard label="Active Roles" note="RBAC summary" tone="success" value={overview.stats.activeRoles} />
      </section>

      <section className="workspace-grid organization-details-grid">
        <div className="workspace-card">
          <div className="section-heading"><div><p className="eyebrow">Details</p><h2>Company information</h2></div></div>
          <div className="organization-detail-grid">
            <InfoTile label="Organization ID" value={organization.orgCode} />
            <InfoTile label="Company Email" value={organization.companyEmail} />
            <InfoTile label="Industry" value={organization.industry || "Not set"} />
            <InfoTile label="Team Size" value={organization.teamSize || "Not set"} />
            <InfoTile label="Your Role" value={formatRole(user.role)} />
            <InfoTile label="Your Department" value={user.department || "Unassigned"} />
          </div>
        </div>

        <div className="workspace-card">
          <div className="section-heading"><div><p className="eyebrow">Departments</p><h2>Company structure</h2></div></div>
          <div className="department-list">
            {overview.departments.length === 0 && <p className="muted">No departments created yet.</p>}
            {overview.departments.slice(0, 5).map((department) => (
              <div className="department-item" key={department.id}>
                <strong>{department.name}</strong>
                <span>{department.description || "No description"}</span>
                <small>{department.employeeCount || 0} employees</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="workspace-card">
        <div className="section-heading"><div><p className="eyebrow">Employees</p><h2>Workspace members</h2></div></div>
        <div className="employee-table">
          {overview.employees.length === 0 && <p className="muted">No employees connected yet.</p>}
          {overview.employees.map((employee) => (
            <div className="employee-row" key={employee.id}>
              <div><strong>{employee.name}</strong><span>{employee.email}</span></div>
              <span>{employee.department || "Unassigned"}</span>
              <small>{formatRole(employee.role)}</small>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
