import type { WorkspacePage } from "./types";

export const workspacePages: { id: WorkspacePage; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "tasks", label: "Tasks" },
  { id: "myOrganization", label: "Organizations" },
  { id: "reports", label: "Reports" },
  { id: "settings", label: "Settings" },
];

export const industries = ["Technology", "Finance", "Healthcare", "Education", "Retail", "Operations"];
export const teamSizes = ["1-10", "11-50", "51-200", "201-1000", "1000+"];

export const pagePaths: Record<WorkspacePage, string> = {
  overview: "/dashboard",
  tasks: "/dashboard/tasks",
  timesheets: "/dashboard/timesheets",
  taskPending: "/dashboard/tasks/pending",
  taskProgress: "/dashboard/tasks/in-progress",
  taskCompleted: "/dashboard/tasks/completed",
  taskDetails: "/dashboard/tasks",
  myOrganization: "/dashboard/organizations",
  teams: "/dashboard/organizations/teams",
  departments: "/dashboard/organizations/departments",
  employees: "/dashboard/organizations/employees",
  approvals: "/dashboard/approvals",
  reports: "/dashboard/reports",
  elements: "/dashboard/elements",
  settings: "/dashboard/settings",
  createTask: "/dashboard/tasks/create",
  createOrganization: "/dashboard/organizations/create",
  organizationDetails: "/dashboard/organizations/current",
};

export const pageToPath = (page: WorkspacePage, id?: number | string | null) => {
  if (page === "taskDetails" && id) return `${pagePaths.taskDetails}/${id}`;
  return pagePaths[page];
};

export const pathToPage = (path: string): WorkspacePage => {
  if (path === "/dashboard" || path === "/dashboard/") return "overview";
  if (path === "/dashboard/tasks/create") return "createTask";
  if (path === "/dashboard/tasks/pending") return "taskPending";
  if (path === "/dashboard/tasks/in-progress") return "taskProgress";
  if (path === "/dashboard/tasks/completed") return "taskCompleted";
  if (/^\/dashboard\/tasks\/\d+/.test(path)) return "taskDetails";
  if (path === "/dashboard/tasks") return "tasks";
  if (path === "/dashboard/organizations/create") return "createOrganization";
  if (path === "/dashboard/organizations/current") return "organizationDetails";
  if (path === "/dashboard/organizations/employees") return "employees";
  if (path === "/dashboard/organizations/departments") return "departments";
  if (path === "/dashboard/organizations/teams") return "teams";
  if (path === "/dashboard/organizations") return "myOrganization";
  if (path === "/dashboard/reports") return "reports";
  if (path === "/dashboard/settings") return "settings";
  if (path === "/dashboard/timesheets") return "timesheets";
  if (path === "/dashboard/approvals") return "approvals";
  if (path === "/dashboard/elements") return "elements";
  return "overview";
};

export const formatOrganizationId = (value: string) => {
  const compactValue = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!compactValue) return "";
  const suffix = compactValue.startsWith("ORG") ? compactValue.slice(3) : compactValue;
  return `ORG-${suffix.slice(0, 12)}`;
};

export const formatDuration = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

export const formatDate = (value?: string | null) => {
  if (!value) return "No deadline";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
};

export const formatRole = (role?: string | null) => (role === "ceo" ? "founder" : role || "employee");
