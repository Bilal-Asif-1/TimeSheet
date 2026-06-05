import { InfoTile, KpiCard, StatusRow } from "./components";
import type { DashboardController } from "./controllerType";
import { formatRole } from "./utils";

type Props = { dashboard: DashboardController };
const cardClass = "rounded-[22px] border border-white/10 bg-[radial-gradient(circle_at_90%_10%,rgba(255,255,255,0.1),transparent_24%),linear-gradient(145deg,rgba(10,10,10,0.94),rgba(31,41,55,0.9))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.36)]";
const heading = (eyebrow: string, title: string) => <div className="mb-4"><p className="text-xs font-extrabold uppercase text-zinc-400">{eyebrow}</p><h2 className="text-2xl font-black text-white">{title}</h2></div>;

// Chote related pages ek file mein hain; complex hone par inhein alag files mein split kiya ja sakta hai.
export function ReportsPage({ dashboard }: Props) {
  const { overview, totals } = dashboard;
  return (
    <section className="grid gap-4">
      <div className={cardClass}>
        {heading("Reports", "Productivity summary")}
        <div className="grid grid-cols-4 gap-3.5">
          <KpiCard label="Total Hours" note="All logged work" tone="neutral" value={totals.totalHours} />
          <KpiCard label="Completed Logs" note="Timesheet entries" tone="success" value={totals.completed.length} />
          <KpiCard label="Team Members" note="Organization users" tone="info" value={overview.stats.employees} />
          <KpiCard label="Departments" note="Company structure" tone="warning" value={overview.stats.departments} />
        </div>
      </div>
      <div className={cardClass}>
        {heading("Breakdown", "Operational metrics")}
        <div className="grid gap-2.5">
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
    <section className="grid grid-cols-2 gap-4">
      <div className={cardClass}>
        {heading("Settings", "Account profile")}
        <div className="grid grid-cols-2 gap-3">
          <InfoTile label="Name" value={user.name} />
          <InfoTile label="Email" value={user.email} />
          <InfoTile label="Provider" value={user.provider} />
          <InfoTile label="Role" value={formatRole(user.role)} />
        </div>
      </div>
      <div className={cardClass}>
        {heading("Access", "Workspace permissions")}
        <div className="grid gap-2.5">
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
    <section className="grid">
      <div className={cardClass}>
        {heading("Teams", "Operational teams")}
        <div className="grid gap-3">
          {departments.length === 0 && <p className="text-sm text-zinc-400">Create departments to organize teams.</p>}
          {departments.map((item) => (
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4" key={item.id}>
              <div className="grid"><strong className="text-white">{item.name}</strong><span className="text-sm text-zinc-400">{item.employeeCount || 0} members</span></div>
              <small className="text-zinc-400">{item.description || "Team workspace"}</small>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
