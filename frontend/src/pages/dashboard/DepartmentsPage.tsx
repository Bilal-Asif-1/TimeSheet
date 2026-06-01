import type { DashboardController } from "./controllerType";

type Props = { dashboard: DashboardController };

const cardClass = "rounded-[26px] border border-white/10 bg-white/[0.05] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.32)]";
const inputClass = "w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none transition focus:border-white/35";
const primaryButton = "rounded-2xl border border-white/15 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButton = "rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15";
const dangerButton = "rounded-2xl border border-red-300/25 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-100 transition hover:bg-red-400/20";

export function DepartmentsPage({ dashboard }: Props) {
  const { department, message, overview, setDepartment, user } = dashboard;
  const canManage = user.role === "ceo" || user.role === "manager";

  if (!overview.organization) return null;

  return (
    <section className="grid gap-6">
      <div className={cardClass}>
        <div className="mb-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-white/45">Departments</p>
          <h2 className="text-2xl font-semibold text-white">Company structure</h2>
        </div>

        {canManage && (
          <div className="mb-6 grid gap-3 lg:grid-cols-[1fr_1.5fr_auto]">
            <input className={inputClass} placeholder="Department name" value={department.name} onChange={(event) => setDepartment({ ...department, name: event.target.value })} />
            <input className={inputClass} placeholder="Description" value={department.description} onChange={(event) => setDepartment({ ...department, description: event.target.value })} />
            <button className={primaryButton} onClick={dashboard.saveDepartment} disabled={department.isSaving}>{department.isSaving ? "Adding..." : "Add Department"}</button>
          </div>
        )}
        {message.error && <p className="mb-4 text-sm font-semibold text-red-300">{message.error}</p>}

        <div className="grid gap-3">
          {overview.departments.length === 0 && <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/50">No departments yet.</p>}
          {overview.departments.map((item) => (
            <div className="rounded-3xl border border-white/10 bg-black/25 p-5" key={item.id}>
              {department.editId === item.id ? (
                <div className="grid gap-3 lg:grid-cols-[1fr_1.5fr_auto]">
                  <input className={inputClass} value={department.editName} onChange={(event) => setDepartment({ ...department, editName: event.target.value })} />
                  <input className={inputClass} value={department.editDescription} onChange={(event) => setDepartment({ ...department, editDescription: event.target.value })} placeholder="Description" />
                  <div className="flex gap-2">
                    <button className={primaryButton} onClick={dashboard.updateDepartment} type="button">Save</button>
                    <button className={secondaryButton} onClick={() => setDepartment({ ...department, editId: null })} type="button">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <strong className="block text-lg text-white">{item.name}</strong>
                    <span className="mt-1 block text-sm text-white/55">{item.description || "No description"}</span>
                    <small className="mt-2 block text-xs text-white/40">{item.employeeCount || 0} employees</small>
                  </div>
                  {canManage && (
                    <div className="flex flex-wrap gap-2">
                      <button className={secondaryButton} onClick={() => dashboard.startDepartmentEdit(item)} type="button">Edit</button>
                      <button className={dangerButton} onClick={() => dashboard.deleteDepartment(item.id)} type="button">Delete</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
