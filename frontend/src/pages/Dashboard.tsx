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

type WorkspacePage =
  | "overview"
  | "tasks"
  | "timesheets"
  | "myOrganization"
  | "teams"
  | "departments"
  | "employees"
  | "approvals"
  | "reports"
  | "elements"
  | "settings"
  | "createOrganization"
  | "organizationDetails";

type OrganizationAction = "create" | "join" | null;

const emptyOverview: OrganizationOverview = {
  organization: null,
  departments: [],
  employees: [],
  stats: { employees: 0, departments: 0, totalHours: 0, activeRoles: 0 },
};

const workspacePages: { id: WorkspacePage; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "tasks", label: "Tasks" },
  { id: "timesheets", label: "Timesheets" },
  { id: "myOrganization", label: "Organizations" },
  { id: "reports", label: "Reports" },
  { id: "settings", label: "Settings" },
];

const industries = ["Technology", "Finance", "Healthcare", "Education", "Retail", "Operations"];
const teamSizes = ["1-10", "11-50", "51-200", "201-1000", "1000+"];

const formatOrganizationId = (value: string) => {
  const compactValue = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!compactValue) return "";

  const suffix = compactValue.startsWith("ORG") ? compactValue.slice(3) : compactValue;
  return `ORG-${suffix.slice(0, 12)}`;
};

export default function Dashboard({ token, user }: DashboardProps) {
  const [activePage, setActivePage] = useState<WorkspacePage>("overview");
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
  const [organizationName, setOrganizationName] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [industry, setIndustry] = useState(industries[0]);
  const [teamSize, setTeamSize] = useState(teamSizes[1]);
  const [organizationError, setOrganizationError] = useState("");
  const [organizationSuccess, setOrganizationSuccess] = useState("");
  const [isCreatingOrganization, setIsCreatingOrganization] = useState(false);
  const [departmentName, setDepartmentName] = useState("");
  const [departmentDescription, setDepartmentDescription] = useState("");
  const [departmentError, setDepartmentError] = useState("");
  const [isAddingDepartment, setIsAddingDepartment] = useState(false);
  const [organizationAction, setOrganizationAction] = useState<OrganizationAction>(null);

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

  const createOrganization = async () => {
    if (!organizationName.trim() || !organizationId.trim()) {
      setOrganizationError("Organization name and Organization ID are required.");
      return;
    }

    try {
      setOrganizationError("");
      setOrganizationSuccess("");
      setIsCreatingOrganization(true);
      const response = await fetch(`${API_BASE}/organization/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          organizationName,
          organizationId,
          industry,
          teamSize,
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to create organization.");

      localStorage.setItem("appToken", payload.token);
      localStorage.setItem("appUser", JSON.stringify(payload.user));
      setOrganizationSuccess(`Created ${payload.organization.orgCode}. Refreshing workspace...`);
      window.setTimeout(() => window.location.reload(), 700);
    } catch (error) {
      const err = error as Error;
      setOrganizationError(err.message);
    } finally {
      setIsCreatingOrganization(false);
    }
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
  const completedTasks = data.length;
  const activeTasks = data.length > 0 ? Math.min(data.length, 3) : 0;
  const pendingTasks = 0;
  const averageHours = completedTasks > 0 ? Math.round((totalHours / completedTasks) * 10) / 10 : 0;
  const hasOrganization = Boolean(overview.organization);
  const isOrgAdmin = user.role === "ceo" || user.role === "manager";
  const organization = overview.organization;
  const isOrganizationArea = [
    "createOrganization",
    "organizationDetails",
    "employees",
    "teams",
    "departments",
  ].includes(activePage);
  const firstName = user.name.trim().split(/\s+/)[0] || "My";
  const personalWorkspaceName = `${firstName}'s Workspace`;
  const visibleWorkspacePages = workspacePages;
  const activeDepartments = overview.departments.slice(0, 4);
  const elementItems = [
    { label: "Workflow approvals", value: overview.organization ? "Ready" : "Locked" },
    { label: "Role matrix", value: `${overview.stats.activeRoles} active` },
    { label: "Time policies", value: "Default" },
    { label: "Automation queue", value: "0 rules" },
  ];
  const kpiCards = [
    { label: "Pending Tasks", value: pendingTasks, note: "Awaiting assignment", tone: "warning" },
    { label: "Active Tasks", value: activeTasks, note: "In progress", tone: "info" },
    { label: "Completed Tasks", value: completedTasks, note: "Logged entries", tone: "success" },
    { label: "Total Hours", value: totalHours, note: `${averageHours}h average`, tone: "neutral" },
  ];
  const recentEntries = data.slice(0, 4);
  const activeTaskEntries = data.slice(0, 3);
  const completedTaskEntries = data.slice(3, 9);

  const createWorkspaceCard = (
    <section className="workspace-card onboarding-action-card">
      <div>
        <p className="eyebrow">Create Workspace</p>
        <h2>Start a new organization</h2>
        <p className="muted">Create your company workspace and become the owner/admin.</p>
      </div>
      <div className="onboarding-form">
        <label>
          <span>Organization name</span>
          <input
            className="input"
            placeholder="WiMetrix"
            value={organizationName}
            onChange={(event) => setOrganizationName(event.target.value)}
          />
        </label>
        <label>
          <span>Organization ID</span>
          <input
            className="input"
            placeholder="ORG-WIMETRIX"
            value={organizationId}
            onChange={(event) => setOrganizationId(formatOrganizationId(event.target.value))}
          />
        </label>
        <div className="onboarding-form-row">
          <label>
            <span>Industry</span>
            <select className="input" value={industry} onChange={(event) => setIndustry(event.target.value)}>
              {industries.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Team size</span>
            <select className="input" value={teamSize} onChange={(event) => setTeamSize(event.target.value)}>
              {teamSizes.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>
        <button className="btn btn-primary" onClick={createOrganization} disabled={isCreatingOrganization}>
          {isCreatingOrganization ? "Creating..." : "Create Organization"}
        </button>
      </div>
      {organizationError && <p className="error-text">{organizationError}</p>}
      {organizationSuccess && <p className="success-text">{organizationSuccess}</p>}
    </section>
  );

  const joinWorkspaceCard = (
    <section className="workspace-card onboarding-action-card">
      <div>
        <p className="eyebrow">Join Workspace</p>
        <h2>Join an existing organization</h2>
        <p className="muted">Use the Organization ID shared by your company.</p>
      </div>
      <div className="onboarding-form">
        <label>
          <span>Organization ID</span>
          <input className="input" placeholder="ORG-X82KLM" value={joinOrgId} onChange={(event) => setJoinOrgId(formatOrganizationId(event.target.value))} />
        </label>
        <label>
          <span>Department</span>
          <input className="input" placeholder="Engineering" value={joinDepartment} onChange={(event) => setJoinDepartment(event.target.value)} />
        </label>
        <button className="btn btn-secondary" onClick={joinOrganization} disabled={isJoining}>
          {isJoining ? "Joining..." : "Join Organization"}
        </button>
      </div>
      {joinError && <p className="error-text">{joinError}</p>}
      {joinSuccess && <p className="success-text">{joinSuccess}</p>}
    </section>
  );

  const noOrganizationActions = (
    <section className="no-organization-actions">
      {createWorkspaceCard}
      {joinWorkspaceCard}
    </section>
  );

  const organizationTopNav = (
    <div className="organization-top-nav">
      <button
        className={activePage === "organizationDetails" ? "active" : ""}
        onClick={() => setActivePage(organization ? "organizationDetails" : "myOrganization")}
        type="button"
      >
        {activePage === "myOrganization" || activePage === "createOrganization" ? "Organizations" : "Home"}
      </button>
      <button className={activePage === "employees" ? "active" : ""} disabled={!hasOrganization} onClick={() => setActivePage("employees")} type="button">
        Members
      </button>
      <button className={activePage === "teams" ? "active" : ""} disabled={!hasOrganization} onClick={() => setActivePage("teams")} type="button">
        Staff
      </button>
      <button className={activePage === "departments" ? "active" : ""} disabled={!hasOrganization} onClick={() => setActivePage("departments")} type="button">
        Departments
      </button>
      {(activePage === "myOrganization" || activePage === "createOrganization") && (
        <button
          className={`organization-create-nav-button${activePage === "createOrganization" ? " active" : ""}`}
          onClick={() => setActivePage("createOrganization")}
          type="button"
        >
          Create Organization
        </button>
      )}
      <button className="organization-exit-button" onClick={() => setActivePage("overview")} type="button">
        Back to Dashboard
      </button>
    </div>
  );

  return (
    <div className={`workspace-shell${hasOrganization ? "" : " no-organization-shell"}${isOrganizationArea ? " organization-area-shell" : ""}`}>
      {!isOrganizationArea && (
        <aside className="workspace-sidebar">
          <div className="sidebar-brand">Workspace</div>
          <nav className="sidebar-nav" aria-label="Workspace sections">
            {visibleWorkspacePages.map((page) => (
              <button
                className={activePage === page.id ? "active" : ""}
                key={page.id}
                onClick={() => setActivePage(page.id)}
                type="button"
              >
                {page.label}
              </button>
            ))}
          </nav>
          <div className="sidebar-profile">
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </div>
        </aside>
      )}

      <div className="dashboard-wrap workspace-dashboard">
        {isOrganizationArea && organizationTopNav}

        {activePage === "overview" && (
          <>
            <section className="workspace-hero-panel personal-hero-panel">
              <div>
                <p className="eyebrow">Overview</p>
                <h1>{personalWorkspaceName}</h1>
                <p className="workspace-hero-copy">
                  Track your work, tasks, time, and recent activity from one focused dashboard.
                </p>
              </div>
              <div className="workspace-hero-meta">
                <span>{user.role || "employee"}</span>
                <strong>{user.name}</strong>
                <small>{user.email}</small>
              </div>
            </section>

            <section className="dashboard-kpi-grid">
              {kpiCards.map((card) => (
                <KpiCard key={card.label} label={card.label} note={card.note} tone={card.tone} value={card.value} />
              ))}
            </section>

            <section className="workspace-grid overview-ops-grid">
              <div className="workspace-card">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Work Queue</p>
                    <h2>Task status</h2>
                  </div>
                </div>
                <div className="status-list">
                  <StatusRow label="Pending review" value={pendingTasks} />
                  <StatusRow label="Active work" value={activeTasks} />
                  <StatusRow label="Completed logs" value={completedTasks} />
                </div>
              </div>

              <div className="workspace-card">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Recent Activity</p>
                    <h2>Latest logged work</h2>
                  </div>
                </div>
                <div className="recent-work-list">
                  {recentEntries.length === 0 && <p className="muted">No work logged yet.</p>}
                  {recentEntries.map((entry) => (
                    <div className="recent-work-item" key={entry.id}>
                      <div>
                        <strong>{entry.task}</strong>
                        <span>Completed log</span>
                      </div>
                      <small>{entry.hours}h</small>
                    </div>
                  ))}
                </div>
              </div>
            </section>

          </>
        )}

        {activePage === "tasks" && (
          <section className="workspace-grid task-board-grid">
            <div className="workspace-card task-column">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Tasks</p>
                  <h2>Pending</h2>
                </div>
                <span className="count-pill">{pendingTasks}</span>
              </div>
              <div className="task-board-list">
                <p className="muted">No pending tasks yet. Real task assignments will appear here.</p>
              </div>
            </div>

            <div className="workspace-card task-column">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Tasks</p>
                  <h2>In progress</h2>
                </div>
                <span className="count-pill">{activeTasks}</span>
              </div>
              <div className="task-board-list">
                {activeTaskEntries.length === 0 && <p className="muted">Add time entries to start building your work queue.</p>}
                {activeTaskEntries.map((entry) => (
                  <div className="task-board-card" key={entry.id}>
                    <strong>{entry.task}</strong>
                    <span>{entry.hours}h logged</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="workspace-card task-column">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Tasks</p>
                  <h2>Completed</h2>
                </div>
                <span className="count-pill">{completedTasks}</span>
              </div>
              <div className="task-board-list">
                {completedTaskEntries.length === 0 && <p className="muted">Completed task history will show here.</p>}
                {completedTaskEntries.map((entry) => (
                  <div className="task-board-card" key={entry.id}>
                    <strong>{entry.task}</strong>
                    <span>{entry.hours}h logged</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activePage === "myOrganization" && (
          <section className={`workspace-grid my-organization-grid${organization ? " organization-connected-grid" : " organization-empty-grid"}`}>
            <div className="workspace-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Organizations</p>
                  <h2>{organization ? "Your workspaces" : "No organization connected"}</h2>
                </div>
                <div className="organization-page-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setOrganizationAction(null);
                      setActivePage("createOrganization");
                    }}
                    type="button"
                  >
                    Create Organization
                  </button>
                  <button
                    className={`btn ${organizationAction === "join" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setOrganizationAction("join")}
                    type="button"
                  >
                    Join Organization
                  </button>
                </div>
              </div>
              {organization ? (
                <div className="organization-connected-actions">
                  <button
                    className="organization-select-button"
                    onClick={() => setActivePage("organizationDetails")}
                    type="button"
                  >
                    <span>Current organization</span>
                    <strong>{organization.name}</strong>
                    <small>{organization.orgCode}</small>
                  </button>
                </div>
              ) : (
                <div className="organization-empty-state">
                  <p className="muted">You are not connected to an organization yet. Use the actions above to continue.</p>
                </div>
              )}
            </div>

            {organizationAction === "join" && (
              <div className="organization-action-panel">
                {joinWorkspaceCard}
              </div>
            )}
          </section>
        )}

        {activePage === "createOrganization" && (
          <section className="workspace-grid single-panel create-organization-page">
            <div className="organization-page-header">
              <div>
                <p className="eyebrow">Organizations</p>
                <h2>Create organization</h2>
              </div>
              <button className="btn btn-secondary" type="button" onClick={() => setActivePage("myOrganization")}>
                Back
              </button>
            </div>
            {createWorkspaceCard}
          </section>
        )}

        {organization && activePage === "organizationDetails" && (
          <section className="organization-details-page">
            <div className="organization-page-header">
              <div>
                <p className="eyebrow">Organization</p>
                <h2>{organization.name}</h2>
              </div>
              <button className="btn btn-secondary" type="button" onClick={() => setActivePage("myOrganization")}>
                Back
              </button>
            </div>

            <section className="workspace-hero-panel organization-detail-hero">
              <div>
                <p className="eyebrow">Workspace Profile</p>
                <h1>{organization.name}</h1>
                <p className="workspace-hero-copy">
                  Organization ID {organization.orgCode} - {organization.industry || "Operations"} workspace
                </p>
              </div>
              <div className="workspace-hero-meta">
                <span>{user.role || "employee"}</span>
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
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Details</p>
                    <h2>Company information</h2>
                  </div>
                </div>
                <div className="organization-detail-grid">
                  <InfoTile label="Organization ID" value={organization.orgCode} />
                  <InfoTile label="Company Email" value={organization.companyEmail} />
                  <InfoTile label="Industry" value={organization.industry || "Not set"} />
                  <InfoTile label="Team Size" value={organization.teamSize || "Not set"} />
                  <InfoTile label="Your Role" value={user.role || "employee"} />
                  <InfoTile label="Your Department" value={user.department || "Unassigned"} />
                </div>
              </div>

              <div className="workspace-card">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Departments</p>
                    <h2>Company structure</h2>
                  </div>
                </div>
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
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Employees</p>
                  <h2>Workspace members</h2>
                </div>
              </div>
              <div className="employee-table">
                {overview.employees.length === 0 && <p className="muted">No employees connected yet.</p>}
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
            </section>
          </section>
        )}

        {overview.organization && activePage === "teams" && (
          <section className="workspace-grid single-panel">
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
          </section>
        )}

        {overview.organization && activePage === "departments" && (
        <section className="workspace-grid">
          <div className="workspace-card">
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
        </section>
        )}

        {overview.organization && activePage === "employees" && (
        <section className="workspace-grid">
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

        {overview.organization && activePage === "approvals" && (
          <section className="workspace-grid single-panel">
            <div className="workspace-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Approvals</p>
                  <h2>Approval center</h2>
                </div>
              </div>
              <div className="status-list">
                <StatusRow label="Pending timesheet approvals" value={0} />
                <StatusRow label="Approved this week" value={completedTasks} />
                <StatusRow label="Policy exceptions" value={0} />
              </div>
            </div>
          </section>
        )}

        {activePage === "reports" && (
          <section className="workspace-grid reports-grid">
            <div className="workspace-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Reports</p>
                  <h2>Productivity summary</h2>
                </div>
              </div>
              <div className="dashboard-kpi-grid reports-kpi-grid">
                <KpiCard label="Total Hours" note="All logged work" tone="neutral" value={totalHours} />
                <KpiCard label="Completed Logs" note="Timesheet entries" tone="success" value={completedTasks} />
                <KpiCard label="Team Members" note="Organization users" tone="info" value={overview.stats.employees} />
                <KpiCard label="Departments" note="Company structure" tone="warning" value={overview.stats.departments} />
              </div>
            </div>

            <div className="workspace-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Breakdown</p>
                  <h2>Operational metrics</h2>
                </div>
              </div>
              <div className="status-list">
                <StatusRow label="Average hours per entry" value={averageHours} />
                <StatusRow label="Active roles" value={overview.stats.activeRoles} />
                <StatusRow label="Pending tasks" value={pendingTasks} />
              </div>
            </div>
          </section>
        )}

        {overview.organization && activePage === "elements" && (
          <section className="workspace-grid single-panel">
            <div className="workspace-card">
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

        {activePage === "settings" && (
          <section className="workspace-grid settings-grid">
            <div className="workspace-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Settings</p>
                  <h2>Account profile</h2>
                </div>
              </div>
              <div className="organization-detail-grid">
                <InfoTile label="Name" value={user.name} />
                <InfoTile label="Email" value={user.email} />
                <InfoTile label="Provider" value={user.provider} />
                <InfoTile label="Role" value={user.role || "employee"} />
              </div>
            </div>

            <div className="workspace-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Access</p>
                  <h2>Workspace permissions</h2>
                </div>
              </div>
              <div className="status-list">
                <StatusRow label="Organization connected" value={hasOrganization ? 1 : 0} />
                <StatusRow label="Can manage departments" value={isOrgAdmin ? 1 : 0} />
                <StatusRow label="Microsoft account" value={user.provider === "microsoft" ? 1 : 0} />
              </div>
            </div>
          </section>
        )}

        {!overview.organization &&
          activePage !== "overview" &&
          activePage !== "tasks" &&
          activePage !== "timesheets" &&
          activePage !== "myOrganization" &&
          activePage !== "reports" &&
          activePage !== "settings" &&
          noOrganizationActions}

        {activePage === "timesheets" && (
        <section className="workspace-card">
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
        )}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  note,
  tone,
  value,
}: {
  label: string;
  note: string;
  tone: string;
  value: number;
}) {
  return (
    <div className={`dashboard-kpi-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="status-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-tile">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
