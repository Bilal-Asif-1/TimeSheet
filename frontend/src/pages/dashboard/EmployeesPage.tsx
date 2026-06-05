import { InfoTile } from "./components";
import type { DashboardController } from "./controllerType";
import { formatRole } from "./utils";

type Props = { dashboard: DashboardController };

const cardClass = "rounded-[26px] border border-white/10 bg-white/[0.05] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.32)]";
const primaryButton = "w-full rounded-2xl border border-white/15 bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200";

export function EmployeesPage({ dashboard }: Props) {
  const { overview, selectedEmployeeId, setActivePage, setSelectedEmployeeId, setTaskForm, taskForm } = dashboard;
  // Left list se selected employee ki complete profile right panel mein dikhai jati hai.
  const selected = overview.employees.find((employee) => employee.id === selectedEmployeeId) || null;
  if (!overview.organization) return null;

  const assignTask = (employeeId: number) => {
    // Employee pehle se task form mein select hota hai, phir create task page khulta hai.
    setTaskForm({ ...taskForm, assignee: String(employeeId) });
    setActivePage("createTask");
  };

  return (
    <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className={cardClass}>
        <div className="mb-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-white/45">Employees</p>
          <h2 className="text-2xl font-semibold text-white">Workspace members</h2>
        </div>
        <div className="grid gap-3">
          {overview.employees.map((employee) => (
            <button className={`grid gap-3 rounded-3xl border p-4 text-left transition md:grid-cols-[1fr_auto_auto] md:items-center ${selectedEmployeeId === employee.id ? "border-white/35 bg-white/14" : "border-white/10 bg-black/25 hover:border-white/25 hover:bg-white/10"}`} key={employee.id} onClick={() => setSelectedEmployeeId(employee.id)} type="button">
              <div><strong className="block text-white">{employee.name}</strong><span className="mt-1 block text-sm text-white/50">{employee.email}</span></div>
              <span className="text-sm text-white/60">{employee.department || "Unassigned"}</span>
              <small className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/70">{formatRole(employee.role)}</small>
            </button>
          ))}
        </div>
      </div>

      <div className={cardClass}>
        {selected ? (
          <>
            <div className="mb-6">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-white/45">Employee Profile</p>
              <h2 className="text-2xl font-semibold text-white">{selected.name}</h2>
            </div>
            <div className="mb-5 grid gap-3 sm:grid-cols-2">
              <InfoTile label="Email" value={selected.email} />
              <InfoTile label="Department" value={selected.department || "Unassigned"} />
              <InfoTile label="Role" value={formatRole(selected.role)} />
              <InfoTile label="Provider" value={selected.provider} />
            </div>
            <button className={primaryButton} type="button" onClick={() => assignTask(selected.id)}>Assign Task</button>
          </>
        ) : (
          <div className="flex min-h-72 flex-col justify-center rounded-3xl border border-dashed border-white/15 bg-black/20 p-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-white/45">Assign Tasks</p>
            <h2 className="text-2xl font-semibold text-white">Select an employee</h2>
            <p className="mt-2 text-sm text-white/55">Click an employee to view profile details and assign a task.</p>
          </div>
        )}
      </div>
    </section>
  );
}
