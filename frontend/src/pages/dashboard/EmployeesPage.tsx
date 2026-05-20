import { InfoTile } from "./components";
import type { DashboardController } from "./controllerType";
import { formatRole } from "./utils";

type Props = { dashboard: DashboardController };

export function EmployeesPage({ dashboard }: Props) {
  const { overview, selectedEmployeeId, setActivePage, setSelectedEmployeeId, setTaskForm, taskForm } = dashboard;
  const selected = overview.employees.find((employee) => employee.id === selectedEmployeeId) || null;
  if (!overview.organization) return null;

  const assignTask = (employeeId: number) => {
    setTaskForm({ ...taskForm, assignee: String(employeeId) });
    setActivePage("createTask");
  };

  return (
    <section className="workspace-grid employee-management-grid">
      <div className="workspace-card">
        <div className="section-heading"><div><p className="eyebrow">Employees</p><h2>Workspace members</h2></div></div>
        <div className="employee-table">
          {overview.employees.map((employee) => (
            <button className={`employee-row employee-select-row${selectedEmployeeId === employee.id ? " active" : ""}`} key={employee.id} onClick={() => setSelectedEmployeeId(employee.id)} type="button">
              <div><strong>{employee.name}</strong><span>{employee.email}</span></div>
              <span>{employee.department || "Unassigned"}</span>
              <small>{formatRole(employee.role)}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="workspace-card employee-assignment-panel">
        {selected ? (
          <>
            <div className="section-heading"><div><p className="eyebrow">Employee Profile</p><h2>{selected.name}</h2></div></div>
            <div className="employee-profile-card">
              <InfoTile label="Email" value={selected.email} />
              <InfoTile label="Department" value={selected.department || "Unassigned"} />
              <InfoTile label="Role" value={formatRole(selected.role)} />
              <InfoTile label="Provider" value={selected.provider} />
            </div>
            <button className="btn btn-primary btn-full" type="button" onClick={() => assignTask(selected.id)}>Assign Task</button>
          </>
        ) : (
          <div className="employee-empty-panel">
            <p className="eyebrow">Assign Tasks</p>
            <h2>Select an employee</h2>
            <p className="muted">Click an employee to view profile details and assign a task.</p>
          </div>
        )}
      </div>
    </section>
  );
}
