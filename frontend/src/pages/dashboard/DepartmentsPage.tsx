import type { DashboardController } from "./controllerType";

type Props = { dashboard: DashboardController };

export function DepartmentsPage({ dashboard }: Props) {
  const { department, message, overview, setDepartment, user } = dashboard;
  const canManage = user.role === "ceo" || user.role === "manager";

  if (!overview.organization) return null;

  return (
    <section className="workspace-grid">
      <div className="workspace-card">
        <div className="section-heading"><div><p className="eyebrow">Departments</p><h2>Company structure</h2></div></div>

        {canManage && (
          <div className="department-form">
            <input className="input" placeholder="Department name" value={department.name} onChange={(event) => setDepartment({ ...department, name: event.target.value })} />
            <input className="input" placeholder="Description" value={department.description} onChange={(event) => setDepartment({ ...department, description: event.target.value })} />
            <button className="btn btn-primary" onClick={dashboard.saveDepartment} disabled={department.isSaving}>{department.isSaving ? "Adding..." : "Add Department"}</button>
          </div>
        )}
        {message.error && <p className="error-text">{message.error}</p>}

        <div className="department-list">
          {overview.departments.length === 0 && <p className="muted">No departments yet.</p>}
          {overview.departments.map((item) => (
            <div className="department-item" key={item.id}>
              {department.editId === item.id ? (
                <div className="department-edit-panel">
                  <input className="input" value={department.editName} onChange={(event) => setDepartment({ ...department, editName: event.target.value })} />
                  <input className="input" value={department.editDescription} onChange={(event) => setDepartment({ ...department, editDescription: event.target.value })} placeholder="Description" />
                  <div className="department-actions">
                    <button className="btn btn-primary" onClick={dashboard.updateDepartment} type="button">Save</button>
                    <button className="btn btn-secondary" onClick={() => setDepartment({ ...department, editId: null })} type="button">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div><strong>{item.name}</strong><span>{item.description || "No description"}</span><small>{item.employeeCount || 0} employees</small></div>
                  {canManage && (
                    <div className="department-actions">
                      <button className="btn btn-secondary" onClick={() => dashboard.startDepartmentEdit(item)} type="button">Edit</button>
                      <button className="btn btn-danger" onClick={() => dashboard.deleteDepartment(item.id)} type="button">Delete</button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
