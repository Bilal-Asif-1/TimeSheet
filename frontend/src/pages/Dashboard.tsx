import { useEffect, useState } from "react";
import { getApiBaseUrl } from "../config/env";

const API_BASE = getApiBaseUrl();
const BASE_URL = `${API_BASE}/timesheet`;

type AppUser = {
  id: number;
  name: string;
  email: string;
  provider: "local" | "microsoft";
  organizationCode?: string | null;
  role?: string | null;
  department?: string | null;
};

type Department = {
  id: number;
  name: string;
  description?: string | null;
  employeeCount?: number;
};

type Employee = {
  id: number;
  name: string;
  email: string;
  role?: string | null;
  department?: string | null;
  provider: "local" | "microsoft";
};

type OrganizationOverview = {
  organization: {
    id: number;
    orgCode: string;
    name: string;
    companyEmail: string;
    industry?: string | null;
    teamSize?: string | null;
  } | null;
  departments: Department[];
  employees: Employee[];
  stats: {
    employees: number;
    departments: number;
    totalHours: number;
    activeRoles: number;
  };
};

type DashboardProps = {
  token: string;
  user: AppUser;
};

const emptyOverview: OrganizationOverview = {
  organization: null,
  departments: [],
  employees: [],
  stats: { employees: 0, departments: 0, totalHours: 0, activeRoles: 0 },
};

export default function Dashboard({ token, user }: DashboardProps) {
  const [data, setData] = useState<any[]>([]);
  const [overview, setOverview] = useState<OrganizationOverview>(emptyOverview);
  const [task, setTask] = useState("");
  const [hours, setHours] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editTask, setEditTask] = useState("");
  const [editHours, setEditHours] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [joinOrgId, setJoinOrgId] = useState("");
  const [joinDepartment, setJoinDepartment] = useState(user.department || "");
  const [joinError, setJoinError] = useState("");
  const [joinSuccess, setJoinSuccess] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [departmentName, setDepartmentName] = useState("");
  const [departmentDescription, setDepartmentDescription] = useState("");
  const [departmentError, setDepartmentError] = useState("");
  const [isAddingDepartment, setIsAddingDepartment] = useState(false);

  const handleAuthFailure = (status: number) => {
    if (status === 401 || status === 403) {
      localStorage.removeItem("appToken");
      localStorage.removeItem("appUser");
      window.location.reload();
      return true;
    }
    return false;
  };

  const loadTimesheets = async () => {
    const res = await fetch(BASE_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const payload = await res.json();
    if (!res.ok) {
      if (handleAuthFailure(res.status)) return;
      console.error("Failed to load timesheets:", payload);
      setData([]);
      return;
    }

    setData(Array.isArray(payload) ? payload : []);
  };

  const loadOrganization = async () => {
    const res = await fetch(`${API_BASE}/organization/overview`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const payload = await res.json();
    if (!res.ok) {
      if (handleAuthFailure(res.status)) return;
      console.error("Failed to load organization:", payload);
      setOverview(emptyOverview);
      return;
    }

    setOverview(payload);
  };

  useEffect(() => {
    loadTimesheets();
    loadOrganization();
  }, [token]);

  const add = async () => {
    if (!task.trim() || !hours) return;

    setIsSaving(true);
    await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ task, hours: Number(hours) }),
    });

    setTask("");
    setHours("");
    await loadTimesheets();
    await loadOrganization();
    setIsSaving(false);
  };

  const remove = async (id: number) => {
    await fetch(`${BASE_URL}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    loadTimesheets();
    loadOrganization();
  };

  const update = async () => {
    if (!editTask.trim() || !editHours || editId === null) return;

    setIsSaving(true);
    await fetch(`${BASE_URL}/${editId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ task: editTask, hours: Number(editHours) }),
    });

    setEditId(null);
    setEditTask("");
    setEditHours("");
    await loadTimesheets();
    await loadOrganization();
    setIsSaving(false);
  };

  const joinOrganization = async () => {
    if (!joinOrgId.trim()) {
      setJoinError("Organization ID is required.");
      return;
    }

    try {
      setJoinError("");
      setJoinSuccess("");
      setIsJoining(true);
      const response = await fetch(`${API_BASE}/auth/join-organization`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ organizationId: joinOrgId, department: joinDepartment }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to join organization.");

      localStorage.setItem("appToken", payload.token);
      localStorage.setItem("appUser", JSON.stringify(payload.user));
      setJoinSuccess(`Joined ${payload.user.organizationCode}. Refreshing workspace...`);
      window.setTimeout(() => window.location.reload(), 700);
    } catch (error) {
      const err = error as Error;
      setJoinError(err.message);
    } finally {
      setIsJoining(false);
    }
  };

  const addDepartment = async () => {
    if (!departmentName.trim()) {
      setDepartmentError("Department name is required.");
      return;
    }

    try {
      setDepartmentError("");
      setIsAddingDepartment(true);
      const response = await fetch(`${API_BASE}/organization/departments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: departmentName,
          description: departmentDescription,
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to add department.");

      setDepartmentName("");
      setDepartmentDescription("");
      await loadOrganization();
    } catch (error) {
      const err = error as Error;
      setDepartmentError(err.message);
    } finally {
      setIsAddingDepartment(false);
    }
  };

  const totalHours = data.reduce((sum, item) => sum + Number(item.hours || 0), 0);
  const isOrgAdmin = user.role === "ceo" || user.role === "manager";
  const orgName = overview.organization?.name || "Personal Workspace";
  const activeDepartments = overview.departments.slice(0, 4);
  const elementItems = [
    { label: "Workflow approvals", value: overview.organization ? "Ready" : "Locked" },
    { label: "Role matrix", value: `${overview.stats.activeRoles} active` },
    { label: "Time policies", value: "Default" },
    { label: "Automation queue", value: "0 rules" },
  ];

  return (
    <div className="workspace-shell">
      <aside className="workspace-sidebar">
        <div className="sidebar-brand">TimeSheet</div>
        <nav className="sidebar-nav" aria-label="Workspace sections">
          <a href="#overview" className="active">Overview</a>
          <a href="#teams">Teams</a>
          <a href="#elements">Elements</a>
          <a href="#departments">Departments</a>
          <a href="#employees">Employees</a>
          <a href="#timesheets">Timesheets</a>
        </nav>
        <div className="sidebar-profile">
          <span>{user.role || "employee"}</span>
          <strong>{user.name}</strong>
          <small>{overview.organization?.orgCode || "No organization"}</small>
        </div>
      </aside>

      <div className="dashboard-wrap workspace-dashboard">
        <section id="overview" className="workspace-hero-panel">
          <div>
            <p className="eyebrow">TimeSheet Workspace</p>
            <h1>{orgName}</h1>
            <p className="workspace-hero-copy">
              {overview.organization
                ? `Organization ID ${overview.organization.orgCode} - ${overview.organization.industry || "Operations"} workspace`
                : "You are in a personal workspace. Join an organization to unlock company departments and employees."}
            </p>
          </div>
          <div className="workspace-hero-meta">
            <span>{user.role || "employee"}</span>
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </div>
        </section>

        <section className="workspace-stats-grid">
          <StatCard label="Employees" value={overview.stats.employees} />
          <StatCard label="Departments" value={overview.stats.departments} />
          <StatCard label="Org Hours" value={overview.stats.totalHours} />
          <StatCard label="My Hours" value={totalHours} />
        </section>

        {!overview.organization && (
        <section className="workspace-card workspace-join-card">
          <div>
            <p className="eyebrow">Join Workspace</p>
            <h2>Connect this user to an organization</h2>
            <p className="muted">After login, employees can join using the Organization ID shared by their company.</p>
          </div>
          <div className="join-org-controls">
            <input className="input" placeholder="ORG-X82KLM" value={joinOrgId} onChange={(event) => setJoinOrgId(event.target.value)} />
            <input className="input" placeholder="Department" value={joinDepartment} onChange={(event) => setJoinDepartment(event.target.value)} />
            <button className="btn btn-secondary" onClick={joinOrganization} disabled={isJoining}>
              {isJoining ? "Joining..." : "Join Organization"}
            </button>
          </div>
          {joinError && <p className="error-text">{joinError}</p>}
          {joinSuccess && <p className="success-text">{joinSuccess}</p>}
        </section>
        )}

        {overview.organization && (
          <section id="teams" className="workspace-grid teams-elements-grid">
            <div className="workspace-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Teams</p>
                  <h2>Operational teams</h2>
                </div>
              </div>
              <div className="team-list">
                {activeDepartments.length === 0 && <p className="muted">Create departments to organize teams.</p>}
                {activeDepartments.map((department) => (
                  <div className="team-card" key={department.id}>
                    <div>
                      <strong>{department.name}</strong>
                      <span>{department.employeeCount || 0} members</span>
                    </div>
                    <small>{department.description || "Team workspace"}</small>
                  </div>
                ))}
              </div>
            </div>

            <div id="elements" className="workspace-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Elements</p>
                  <h2>Workspace modules</h2>
                </div>
              </div>
              <div className="elements-grid">
                {elementItems.map((item) => (
                  <div className="element-card" key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {overview.organization && (
        <section id="departments" className="workspace-grid">
          <div id="employees" className="workspace-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Departments</p>
                <h2>Company structure</h2>
              </div>
            </div>

            {isOrgAdmin && (
              <div className="department-form">
                <input className="input" placeholder="Department name" value={departmentName} onChange={(event) => setDepartmentName(event.target.value)} />
                <input className="input" placeholder="Description" value={departmentDescription} onChange={(event) => setDepartmentDescription(event.target.value)} />
                <button className="btn btn-primary" onClick={addDepartment} disabled={isAddingDepartment}>
                  {isAddingDepartment ? "Adding..." : "Add Department"}
                </button>
              </div>
            )}
            {departmentError && <p className="error-text">{departmentError}</p>}

            <div className="department-list">
              {overview.departments.length === 0 && <p className="muted">No departments yet.</p>}
              {overview.departments.map((department) => (
                <div className="department-item" key={department.id}>
                  <strong>{department.name}</strong>
                  <span>{department.description || "No description"}</span>
                  <small>{department.employeeCount || 0} employees</small>
                </div>
              ))}
            </div>
          </div>

          <div className="workspace-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Employees</p>
                <h2>Workspace members</h2>
              </div>
            </div>
            <div className="employee-table">
              {overview.employees.map((employee) => (
                <div className="employee-row" key={employee.id}>
                  <div>
                    <strong>{employee.name}</strong>
                    <span>{employee.email}</span>
                  </div>
                  <span>{employee.department || "Unassigned"}</span>
                  <small>{employee.role || "employee"}</small>
                </div>
              ))}
            </div>
          </div>
        </section>
        )}

        <section id="timesheets" className="workspace-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Timesheets</p>
            <h2>My time entries</h2>
          </div>
          <div className="pill">
            Total hours: <strong>{totalHours}</strong>
          </div>
        </div>

        <div className="add-form">
          <input className="input" id="task" name="task" placeholder="Task" value={task} onChange={(e) => setTask(e.target.value)} />
          <input className="input" id="hours" name="hours" placeholder="Hours" type="number" min={0} value={hours} onChange={(e) => setHours(e.target.value)} />
          <button className="btn btn-primary" onClick={add} disabled={isSaving}>
            {isSaving ? "Saving..." : "Add entry"}
          </button>
        </div>

        <div className="list">
          {data.length === 0 && <p className="muted">No entries yet. Add your first task above.</p>}
          {data.map((item) => (
            <div key={item.id} className="list-item timesheet-row-card">
              {editId === item.id ? (
                <div className="edit-grid">
                  <input className="input" value={editTask} onChange={(e) => setEditTask(e.target.value)} />
                  <input className="input" value={editHours} type="number" min={0} onChange={(e) => setEditHours(e.target.value)} />
                  <button className="btn btn-primary" onClick={update} disabled={isSaving}>Save</button>
                </div>
              ) : (
                <div className="row">
                  <div>
                    <p className="task-name">{item.task}</p>
                    <p className="muted">{item.hours} hours</p>
                  </div>
                  <div className="actions">
                    <button className="btn btn-secondary" onClick={() => {
                      setEditId(item.id);
                      setEditTask(item.task);
                      setEditHours(String(item.hours));
                    }}>
                      Edit
                    </button>
                    <button className="btn btn-danger" onClick={() => remove(item.id)}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="workspace-stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
