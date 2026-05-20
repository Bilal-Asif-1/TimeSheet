import { InfoTile, KpiCard, StatusRow } from "./components";
import type { DashboardController } from "./controllerType";
import { formatRole } from "./utils";

type Props = { dashboard: DashboardController };

export function ReportsPage({ dashboard }: Props) {
  const { overview, totals } = dashboard;
  return (
    <section className="workspace-grid reports-grid">
      <div className="workspace-card">
        <div className="section-heading"><div><p className="eyebrow">Reports</p><h2>Productivity summary</h2></div></div>
        <div className="dashboard-kpi-grid reports-kpi-grid">
          <KpiCard label="Total Hours" note="All logged work" tone="neutral" value={totals.totalHours} />
          <KpiCard label="Completed Logs" note="Timesheet entries" tone="success" value={totals.completed.length} />
          <KpiCard label="Team Members" note="Organization users" tone="info" value={overview.stats.employees} />
          <KpiCard label="Departments" note="Company structure" tone="warning" value={overview.stats.departments} />
        </div>
      </div>
      <div className="workspace-card">
        <div className="section-heading"><div><p className="eyebrow">Breakdown</p><h2>Operational metrics</h2></div></div>
        <div className="status-list">
          <StatusRow label="Average hours per entry" value={totals.averageHours} />
          <StatusRow label="Active roles" value={overview.stats.activeRoles} />
          <StatusRow label="Pending tasks" value={totals.pending.length} />
        </div>
      </div>
    </section>
  );
}

export function SettingsPage({ dashboard }: Props) {
  const { overview, user } = dashboard;
  const canManage = user.role === "ceo" || user.role === "manager";
  return (
    <section className="workspace-grid settings-grid">
      <div className="workspace-card">
        <div className="section-heading"><div><p className="eyebrow">Settings</p><h2>Account profile</h2></div></div>
        <div className="organization-detail-grid">
          <InfoTile label="Name" value={user.name} />
          <InfoTile label="Email" value={user.email} />
          <InfoTile label="Provider" value={user.provider} />
          <InfoTile label="Role" value={formatRole(user.role)} />
        </div>
      </div>
      <div className="workspace-card">
        <div className="section-heading"><div><p className="eyebrow">Access</p><h2>Workspace permissions</h2></div></div>
        <div className="status-list">
          <StatusRow label="Organization connected" value={overview.organization ? 1 : 0} />
          <StatusRow label="Can manage departments" value={canManage ? 1 : 0} />
          <StatusRow label="Microsoft account" value={user.provider === "microsoft" ? 1 : 0} />
        </div>
      </div>
    </section>
  );
}

export function TeamsPage({ dashboard }: Props) {
  const departments = dashboard.overview.departments.slice(0, 4);
  return (
    <section className="workspace-grid single-panel">
      <div className="workspace-card">
        <div className="section-heading"><div><p className="eyebrow">Teams</p><h2>Operational teams</h2></div></div>
        <div className="team-list">
          {departments.length === 0 && <p className="muted">Create departments to organize teams.</p>}
          {departments.map((item) => (
            <div className="team-card" key={item.id}>
              <div><strong>{item.name}</strong><span>{item.employeeCount || 0} members</span></div>
              <small>{item.description || "Team workspace"}</small>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
