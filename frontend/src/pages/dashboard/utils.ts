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

export const allDashboardPages: WorkspacePage[] = [
  "overview", "tasks", "timesheets", "taskPending", "taskProgress", "taskCompleted", "taskDetails",
  "myOrganization", "teams", "departments", "employees", "approvals", "reports", "elements", "settings", "createTask",
  "createOrganization", "organizationDetails",
];

export const pendingDashboardPages: WorkspacePage[] = [
  "overview", "tasks", "taskPending", "taskProgress", "taskCompleted", "organizationDetails",
];

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
