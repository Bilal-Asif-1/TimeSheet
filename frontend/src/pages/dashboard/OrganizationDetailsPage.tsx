import { InfoTile, KpiCard } from "./components";
import type { DashboardController } from "./controllerType";
import { formatRole } from "./utils";

type Props = { dashboard: DashboardController };

const cardClass = "rounded-[26px] border border-white/10 bg-white/[0.05] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.32)]";

export function OrganizationDetailsPage({ dashboard }: Props) {
  const { overview, user } = dashboard;
  const organization = overview.organization;
  if (!organization) return null;

  return (
    <section className="grid gap-6">
      <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.14),rgba(255,255,255,0.04))] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.38)]">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-white/45">Workspace Profile</p>
          <h1 className="text-4xl font-semibold text-white">{organization.name}</h1>
          <p className="mt-3 text-sm text-white/55">Organization ID {organization.orgCode} - {organization.industry || "Operations"} workspace</p>
        </div>
        <div className="mt-6 w-fit rounded-3xl border border-white/10 bg-black/25 p-4">
          <span className="text-xs uppercase tracking-[0.18em] text-white/45">{formatRole(user.role)}</span>
          <strong className="mt-2 block text-white">{user.name}</strong>
          <small className="mt-1 block text-white/50">{user.email}</small>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Employees" note="Workspace users" tone="info" value={overview.stats.employees} />
        <KpiCard label="Departments" note="Company structure" tone="warning" value={overview.stats.departments} />
        <KpiCard label="Org Hours" note="Logged by members" tone="neutral" value={overview.stats.totalHours} />
        <KpiCard label="Active Roles" note="RBAC summary" tone="success" value={overview.stats.activeRoles} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className={cardClass}>
          <div className="mb-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-white/45">Details</p>
            <h2 className="text-2xl font-semibold text-white">Company information</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoTile label="Organization ID" value={organization.orgCode} />
            <InfoTile label="Company Email" value={organization.companyEmail} />
            <InfoTile label="Industry" value={organization.industry || "Not set"} />
            <InfoTile label="Team Size" value={organization.teamSize || "Not set"} />
            <InfoTile label="Your Role" value={formatRole(user.role)} />
            <InfoTile label="Your Department" value={user.department || "Unassigned"} />
          </div>
        </div>

        <div className={cardClass}>
          <div className="mb-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-white/45">Departments</p>
            <h2 className="text-2xl font-semibold text-white">Company structure</h2>
          </div>
          <div className="grid gap-3">
            {overview.departments.length === 0 && <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/50">No departments created yet.</p>}
            {overview.departments.slice(0, 5).map((department) => (
              <div className="rounded-3xl border border-white/10 bg-black/25 p-4" key={department.id}>
                <strong className="block text-white">{department.name}</strong>
                <span className="mt-1 block text-sm text-white/55">{department.description || "No description"}</span>
                <small className="mt-2 block text-xs text-white/40">{department.employeeCount || 0} employees</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={cardClass}>
        <div className="mb-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-white/45">Employees</p>
          <h2 className="text-2xl font-semibold text-white">Workspace members</h2>
        </div>
        <div className="grid gap-3">
          {overview.employees.length === 0 && <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/50">No employees connected yet.</p>}
          {overview.employees.map((employee) => (
            <div className="grid gap-3 rounded-3xl border border-white/10 bg-black/25 p-4 md:grid-cols-[1fr_auto_auto] md:items-center" key={employee.id}>
              <div><strong className="block text-white">{employee.name}</strong><span className="mt-1 block text-sm text-white/50">{employee.email}</span></div>
              <span className="text-sm text-white/60">{employee.department || "Unassigned"}</span>
              <small className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/70">{formatRole(employee.role)}</small>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
