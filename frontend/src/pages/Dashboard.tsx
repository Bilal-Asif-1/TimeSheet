import { useEffect, useState } from "react";
import { getApiBaseUrl } from "../config/env";

const API_BASE = getApiBaseUrl();
const BASE_URL = `${API_BASE}/timesheet`;
const TASK_URL = `${API_BASE}/tasks`;

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

type OrganizationMembership = {
  id: number;
  orgCode: string;
  name: string;
  companyEmail: string;
  industry?: string | null;
  teamSize?: string | null;
  role: string;
  department?: string | null;
  membershipType: "owned" | "joined";
  isActive: boolean;
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
  memberships: OrganizationMembership[];
  ownedOrganizations: OrganizationMembership[];
  joinedOrganizations: OrganizationMembership[];
  departments: Department[];
  employees: Employee[];
  stats: {
    employees: number;
    departments: number;
    totalHours: number;
    activeRoles: number;
  };
};

type TaskAttachment = {
  id: number;
  originalName: string;
  mimeType?: string | null;
  size: number;
  url: string;
};

type WorkflowTask = {
  id: number;
  title: string;
  description?: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed";
  estimatedHours?: string | number | null;
  deadlineAt?: string | null;
  startedAt?: string | null;
  totalSeconds: number;
  completionReport?: string | null;
  blockers?: string | null;
  submittedAt?: string | null;
  createdAt: string;
  organization: { id: number; name: string; orgCode: string };
  assignedBy: { id: number; name: string; email: string };
  assignedTo: { id: number; name: string; email: string; department?: string | null };
  attachments: TaskAttachment[];
};

type DashboardProps = {
  token: string;
  user: AppUser;
};

type WorkspacePage =
  | "overview"
  | "tasks"
  | "timesheets"
  | "taskPending"
  | "taskProgress"
  | "taskCompleted"
  | "taskDetails"
  | "myOrganization"
  | "teams"
  | "departments"
  | "employees"
  | "approvals"
  | "reports"
  | "elements"
  | "settings"
  | "createTask"
  | "createOrganization"
  | "organizationDetails";

type OrganizationAction = "create" | "join" | null;

const emptyOverview: OrganizationOverview = {
  organization: null,
  memberships: [],
  ownedOrganizations: [],
  joinedOrganizations: [],
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

const pendingDashboardPages: WorkspacePage[] = [
  "overview",
  "tasks",
  "taskPending",
  "taskProgress",
  "taskCompleted",
  "organizationDetails",
];

const industries = ["Technology", "Finance", "Healthcare", "Education", "Retail", "Operations"];
const teamSizes = ["1-10", "11-50", "51-200", "201-1000", "1000+"];

const formatOrganizationId = (value: string) => {
  const compactValue = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!compactValue) return "";

  const suffix = compactValue.startsWith("ORG") ? compactValue.slice(3) : compactValue;
  return `ORG-${suffix.slice(0, 12)}`;
};

const formatDuration = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const formatDate = (value?: string | null) => {
  if (!value) return "No deadline";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
};

export default function Dashboard({ token, user }: DashboardProps) {
  const [activePage, setActivePage] = useState<WorkspacePage>(() => {
    const pendingPage = localStorage.getItem("pendingDashboardPage");
    if (pendingDashboardPages.includes(pendingPage as WorkspacePage)) {
      localStorage.removeItem("pendingDashboardPage");
      return pendingPage as WorkspacePage;
    }
    return "overview";
  });
  const [data, setData] = useState<any[]>([]);
  const [workflowTasks, setWorkflowTasks] = useState<WorkflowTask[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [_timerTick, setTimerTick] = useState(0);
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
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskPriority, setTaskPriority] = useState<WorkflowTask["priority"]>("medium");
  const [taskEstimate, setTaskEstimate] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [taskFiles, setTaskFiles] = useState<FileList | null>(null);
  const [taskError, setTaskError] = useState("");
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [completionTaskId, setCompletionTaskId] = useState<number | null>(null);
  const [completionReport, setCompletionReport] = useState("");
  const [completionBlockers, setCompletionBlockers] = useState("");

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

  const loadWorkflowTasks = async () => {
    const res = await fetch(TASK_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const payload = await res.json();
    if (!res.ok) {
      if (handleAuthFailure(res.status)) return;
      console.error("Failed to load workflow tasks:", payload);
      setWorkflowTasks([]);
      return;
    }

    setWorkflowTasks(Array.isArray(payload) ? payload : []);
  };

  useEffect(() => {
    loadTimesheets();
    loadOrganization();
    loadWorkflowTasks();
  }, [token]);

  useEffect(() => {
    const timer = window.setInterval(() => setTimerTick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

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
    await loadWorkflowTasks();
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

  const selectOrganization = async (
    organizationIdValue: number | string,
    nextPage: WorkspacePage = "organizationDetails",
  ) => {
    try {
      const response = await fetch(`${API_BASE}/organization/select`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ organizationId: organizationIdValue }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to open organization.");

      localStorage.setItem("appToken", payload.token);
      localStorage.setItem("appUser", JSON.stringify(payload.user));
      localStorage.setItem("pendingDashboardPage", nextPage);
      window.setTimeout(() => window.location.reload(), 250);
    } catch (error) {
      const err = error as Error;
      setOrganizationError(err.message);
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

  const createWorkflowTask = async () => {
    if (!taskTitle.trim() || !taskAssignee) {
      setTaskError("Task title and assignee are required.");
      return;
    }

    try {
      setTaskError("");
      setIsCreatingTask(true);
      const formData = new FormData();
      formData.append("title", taskTitle);
      formData.append("description", taskDescription);
      formData.append("assignedTo", taskAssignee);
      formData.append("priority", taskPriority);
      formData.append("estimatedHours", taskEstimate);
      formData.append("deadlineAt", taskDeadline);
      if (taskFiles) {
        Array.from(taskFiles).forEach((file) => formData.append("attachments", file));
      }

      const response = await fetch(TASK_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to create task.");

      setTaskTitle("");
      setTaskDescription("");
      setTaskAssignee("");
      setTaskPriority("medium");
      setTaskEstimate("");
      setTaskDeadline("");
      setTaskFiles(null);
      const fileInput = document.getElementById("task-attachments") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
      await loadWorkflowTasks();
      setActivePage("tasks");
    } catch (error) {
      const err = error as Error;
      setTaskError(err.message);
    } finally {
      setIsCreatingTask(false);
    }
  };

  const runTaskAction = async (taskId: number, action: "start" | "stop") => {
    const response = await fetch(`${TASK_URL}/${taskId}/${action}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const payload = await response.json();
      setTaskError(payload.error || "Task action failed.");
      return;
    }
    await loadWorkflowTasks();
  };

  const submitTaskCompletion = async (taskId: number) => {
    if (!completionReport.trim()) {
      setTaskError("Completion report is required.");
      return;
    }

    const response = await fetch(`${TASK_URL}/${taskId}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        completionReport,
        blockers: completionBlockers,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setTaskError(payload.error || "Unable to complete task.");
      return;
    }

    setTaskError("");
    setCompletionTaskId(null);
    setCompletionReport("");
    setCompletionBlockers("");
    await loadWorkflowTasks();
  };

  const totalHours = data.reduce((sum, item) => sum + Number(item.hours || 0), 0);
  const completedTasks = workflowTasks.filter((item) => item.status === "completed").length;
  const pendingWorkflowTasks = workflowTasks.filter((item) => item.status === "pending");
  const activeWorkflowTasks = workflowTasks.filter((item) => item.status === "in_progress");
  const completedWorkflowTasks = workflowTasks.filter((item) => item.status === "completed");
  const myAssignedTasks = workflowTasks.filter((item) => item.assignedTo.id === user.id);
  const assignedByMeTasks = workflowTasks.filter((item) => item.assignedBy.id === user.id);
  const activeTasks = activeWorkflowTasks.length;
  const pendingTasks = pendingWorkflowTasks.length;
  const averageHours = completedTasks > 0 ? Math.round((totalHours / completedTasks) * 10) / 10 : 0;
  const hasOrganization = Boolean(overview.organization);
  const isOrgAdmin = user.role === "ceo" || user.role === "manager";
  const organization = overview.organization;
  const isOrganizationArea = [
    "createTask",
    "createOrganization",
    "organizationDetails",
    "employees",
    "teams",
    "departments",
  ].includes(activePage);
  const showOrganizationTopNav = isOrganizationArea && activePage !== "createTask";
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
  const activeTaskEntries = activeWorkflowTasks;
  const completedTaskEntries = completedWorkflowTasks;
  const taskStatusPages = {
    taskPending: {
      eyebrow: "Pending Tasks",
      title: "Pending",
      count: pendingTasks,
      empty: "No pending tasks yet.",
      items: pendingWorkflowTasks,
    },
    taskProgress: {
      eyebrow: "Active Tasks",
      title: "In progress",
      count: activeTasks,
      empty: "No active work right now.",
      items: activeTaskEntries,
    },
    taskCompleted: {
      eyebrow: "Completed Tasks",
      title: "Completed",
      count: completedWorkflowTasks.length,
      empty: "Completed task reports will show here.",
      items: completedTaskEntries,
    },
  } as const;
  const selectedTask = workflowTasks.find((item) => item.id === selectedTaskId) || null;

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

  const renderOrganizationCard = (item: OrganizationMembership) => (
    <button
      className={`organization-select-button${item.isActive ? " active" : ""}`}
      key={`${item.membershipType}-${item.id}`}
      onClick={() => (item.isActive ? setActivePage("organizationDetails") : selectOrganization(item.id))}
      type="button"
    >
      <span>{item.membershipType === "owned" ? "Created by you" : "Joined workspace"}</span>
      <strong>{item.name}</strong>
      <small>{item.orgCode}</small>
      <div className="organization-card-meta">
        <em>{item.role || "employee"}</em>
        {item.department && <em>{item.department}</em>}
        {item.isActive && <em>Active</em>}
      </div>
    </button>
  );

  const renderWorkflowTaskCard = (item: WorkflowTask) => {
    const isTaskInActiveOrganization = item.organization.id === organization?.id;
    const taskPage =
      item.status === "pending" ? "taskPending" : item.status === "in_progress" ? "taskProgress" : "taskCompleted";
    const runningSeconds = item.startedAt
      ? Math.floor((Date.now() - new Date(item.startedAt).getTime()) / 1000)
      : 0;
    const trackedSeconds = item.totalSeconds + runningSeconds;

    return (
      <div
        className={`task-board-card workflow-task-card priority-${item.priority}`}
        key={item.id}
        onClick={() => {
          if (!isTaskInActiveOrganization) {
            selectOrganization(item.organization.id, taskPage);
            return;
          }
          setSelectedTaskId(item.id);
          setActivePage("taskDetails");
        }}
        role="button"
        tabIndex={0}
      >
        <div className="workflow-task-card-top">
          <span>{item.priority}</span>
          <small>{formatDate(item.deadlineAt)}</small>
        </div>
        <button
          className="task-org-chip"
          onClick={(event) => {
            event.stopPropagation();
            if (isTaskInActiveOrganization) {
              setActivePage("organizationDetails");
            } else {
              selectOrganization(item.organization.id, taskPage);
            }
          }}
          type="button"
        >
          {item.organization.name} · {item.organization.orgCode}
        </button>
        <strong>{item.title}</strong>
        {item.description && <p>{item.description}</p>}
        <div className="workflow-task-meta">
          <span>To: {item.assignedTo.name}</span>
          <span>By: {item.assignedBy.name}</span>
          <span>{formatDuration(trackedSeconds)}</span>
        </div>
      </div>
    );
  };

  const renderTaskDetailPage = (item: WorkflowTask) => {
    const isMine = item.assignedTo.id === user.id;
    const runningSeconds = item.startedAt
      ? Math.floor((Date.now() - new Date(item.startedAt).getTime()) / 1000)
      : 0;
    const trackedSeconds = item.totalSeconds + runningSeconds;

    return (
      <section className="workspace-grid single-panel task-status-page">
        <div className="organization-page-header">
          <div>
            <p className="eyebrow">Task Details</p>
            <h2>{item.title}</h2>
          </div>
          <button className="btn btn-secondary" type="button" onClick={() => setActivePage(item.status === "pending" ? "taskPending" : item.status === "in_progress" ? "taskProgress" : "taskCompleted")}>
            Back
          </button>
        </div>

        <div className={`workspace-card workflow-task-card task-detail-card priority-${item.priority}`}>
          <div className="workflow-task-card-top">
            <span>{item.priority}</span>
            <small>{formatDate(item.deadlineAt)}</small>
          </div>
          <button className="task-org-chip" onClick={() => setActivePage("organizationDetails")} type="button">
            {item.organization.name} · {item.organization.orgCode}
          </button>
          <strong>{item.title}</strong>
          {item.description && <p>{item.description}</p>}
          <div className="workflow-task-meta">
            <span>To: {item.assignedTo.name}</span>
            <span>By: {item.assignedBy.name}</span>
            <span>{formatDuration(trackedSeconds)}</span>
          </div>
          {item.attachments.length > 0 && (
            <div className="task-attachment-list">
              {item.attachments.map((attachment) => (
                <a href={`${API_BASE}${attachment.url}`} key={attachment.id} rel="noreferrer" target="_blank">
                  {attachment.originalName}
                </a>
              ))}
            </div>
          )}
          {item.status !== "completed" && isMine && (
            <div className="task-action-row">
              {item.startedAt ? (
                <button className="btn btn-secondary" onClick={() => runTaskAction(item.id, "stop")} type="button">
                  Stop Timer
                </button>
              ) : (
                <button className="btn btn-primary" onClick={() => runTaskAction(item.id, "start")} type="button">
                  Start Timer
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => setCompletionTaskId(item.id)} type="button">
                End Task
              </button>
            </div>
          )}
          {completionTaskId === item.id && (
            <div className="completion-panel">
              <textarea
                className="input"
                placeholder="Write your completion report: what was done, issues, notes for the task owner..."
                rows={4}
                value={completionReport}
                onChange={(event) => setCompletionReport(event.target.value)}
              />
              <textarea
                className="input"
                placeholder="Blockers or issues faced (optional)"
                rows={3}
                value={completionBlockers}
                onChange={(event) => setCompletionBlockers(event.target.value)}
              />
              <div className="task-action-row">
                <button className="btn btn-primary" onClick={() => submitTaskCompletion(item.id)} type="button">
                  Submit Report
                </button>
                <button className="btn btn-secondary" onClick={() => setCompletionTaskId(null)} type="button">
                  Cancel
                </button>
              </div>
            </div>
          )}
          {item.status === "completed" && (
            <div className="completion-summary">
              <span>Submitted report</span>
              <p>{item.completionReport || "No report text."}</p>
              {item.blockers && <small>Issues: {item.blockers}</small>}
            </div>
          )}
        </div>
      </section>
    );
  };

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
        {showOrganizationTopNav && organizationTopNav}

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
          <>
            <section className="workspace-grid single-panel task-toolbar-grid">
              <div className="workspace-card task-toolbar-card">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Workflow</p>
                    <h2>Task control center</h2>
                  </div>
                  <button className="btn btn-primary" onClick={() => setActivePage("createTask")} type="button">
                    Create Task
                  </button>
                </div>
                <div className="task-insight-grid">
                  <InfoTile label="Assigned to me" value={String(myAssignedTasks.length)} />
                  <InfoTile label="Created by me" value={String(assignedByMeTasks.length)} />
                  <InfoTile label="Running now" value={String(activeTasks)} />
                  <InfoTile label="Completed" value={String(completedWorkflowTasks.length)} />
                </div>
              </div>
            </section>

            <section className="workspace-grid task-summary-grid">
              <button className="workspace-card task-summary-card" onClick={() => setActivePage("taskPending")} type="button">
                <span>Tasks</span>
                <strong>Pending</strong>
                <small>{pendingTasks}</small>
                <p>New assignments waiting to be started.</p>
              </button>

              <button className="workspace-card task-summary-card" onClick={() => setActivePage("taskProgress")} type="button">
                <span>Tasks</span>
                <strong>In progress</strong>
                <small>{activeTasks}</small>
                <p>Running work with active timers.</p>
              </button>

              <button className="workspace-card task-summary-card" onClick={() => setActivePage("taskCompleted")} type="button">
                <span>Tasks</span>
                <strong>Completed</strong>
                <small>{completedWorkflowTasks.length}</small>
                <p>Submitted work reports and finished tasks.</p>
              </button>
            </section>
          </>
        )}

        {(activePage === "taskPending" || activePage === "taskProgress" || activePage === "taskCompleted") && (
          <section className="workspace-grid single-panel task-status-page">
            <div className="organization-page-header">
              <div>
                <p className="eyebrow">{taskStatusPages[activePage].eyebrow}</p>
                <h2>{taskStatusPages[activePage].title}</h2>
              </div>
              <button className="btn btn-secondary" type="button" onClick={() => setActivePage("tasks")}>
                Back
              </button>
            </div>

            <div className="workspace-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Tasks</p>
                  <h2>{taskStatusPages[activePage].title}</h2>
                </div>
                <span className="count-pill">{taskStatusPages[activePage].count}</span>
              </div>
              <div className="task-detail-list">
                {taskStatusPages[activePage].items.length === 0 && <p className="muted">{taskStatusPages[activePage].empty}</p>}
                {taskStatusPages[activePage].items.map(renderWorkflowTaskCard)}
              </div>
            </div>
          </section>
        )}

        {activePage === "taskDetails" && selectedTask && renderTaskDetailPage(selectedTask)}

        {activePage === "createTask" && (
          <section className="workspace-grid single-panel create-task-page">
            <div className="organization-page-header">
              <div>
                <p className="eyebrow">Task Assignment</p>
                <h2>Create task</h2>
              </div>
              <button className="btn btn-secondary" type="button" onClick={() => setActivePage("tasks")}>
                Back
              </button>
            </div>

            <div className="workspace-card task-create-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">New Workflow Item</p>
                  <h2>Detailed task brief</h2>
                </div>
              </div>
              <div className="task-create-form">
                <input className="input" placeholder="Task title" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} />
                <select className="input" value={taskAssignee} onChange={(event) => setTaskAssignee(event.target.value)}>
                  <option value="">Assign to employee</option>
                  {overview.employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} - {employee.department || "Unassigned"}
                    </option>
                  ))}
                </select>
                <textarea
                  className="input"
                  placeholder="Task details, expected output, context, acceptance criteria..."
                  rows={6}
                  value={taskDescription}
                  onChange={(event) => setTaskDescription(event.target.value)}
                />
                <div className="task-create-row">
                  <select className="input" value={taskPriority} onChange={(event) => setTaskPriority(event.target.value as WorkflowTask["priority"])}>
                    <option value="low">Low priority</option>
                    <option value="medium">Medium priority</option>
                    <option value="high">High priority</option>
                    <option value="urgent">Urgent priority</option>
                  </select>
                  <input className="input" placeholder="Estimated hours" type="number" min="0" step="0.5" value={taskEstimate} onChange={(event) => setTaskEstimate(event.target.value)} />
                  <input className="input" type="datetime-local" value={taskDeadline} onChange={(event) => setTaskDeadline(event.target.value)} />
                </div>
                <label className="task-file-drop">
                  <span>Attach files</span>
                  <small>PDF, image, ZIP, document, or supporting material. Up to 8 files.</small>
                  <input id="task-attachments" multiple type="file" onChange={(event) => setTaskFiles(event.target.files)} />
                </label>
                <button className="btn btn-primary" onClick={createWorkflowTask} disabled={isCreatingTask || !overview.organization} type="button">
                  {isCreatingTask ? "Creating Task..." : "Assign Task"}
                </button>
                {!overview.organization && <p className="muted">Select or create an organization before assigning tasks.</p>}
                {taskError && <p className="error-text">{taskError}</p>}
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
                  <h2>Your workspaces</h2>
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
              {overview.memberships.length > 0 ? (
                <div className="organization-lists">
                  <div className="organization-list-section">
                    <div className="organization-list-heading">
                      <span>My Organizations</span>
                      <small>{overview.ownedOrganizations.length}</small>
                    </div>
                    {overview.ownedOrganizations.length > 0 ? (
                      <div className="organization-card-grid">
                        {overview.ownedOrganizations.map(renderOrganizationCard)}
                      </div>
                    ) : (
                      <p className="muted">Organizations you create will appear here.</p>
                    )}
                  </div>

                  <div className="organization-list-section">
                    <div className="organization-list-heading">
                      <span>Joined Organizations</span>
                      <small>{overview.joinedOrganizations.length}</small>
                    </div>
                    {overview.joinedOrganizations.length > 0 ? (
                      <div className="organization-card-grid">
                        {overview.joinedOrganizations.map(renderOrganizationCard)}
                      </div>
                    ) : (
                      <p className="muted">Organizations you join as employee, manager, or staff will appear here.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="organization-empty-state">
                  <p className="muted">You are not connected to an organization yet. Create your own workspace or join one shared by your company.</p>
                </div>
              )}
              {organizationError && <p className="error-text">{organizationError}</p>}
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
