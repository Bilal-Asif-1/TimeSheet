export type AppUser = {
  id: number;
  name: string;
  email: string;
  provider: "local" | "microsoft";
  organizationCode?: string | null;
  role?: string | null;
  department?: string | null;
};

export type Department = {
  id: number;
  name: string;
  description?: string | null;
  employeeCount?: number;
};

export type Employee = {
  id: number;
  name: string;
  email: string;
  role?: string | null;
  department?: string | null;
  provider: "local" | "microsoft";
};

export type OrganizationMembership = {
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

export type OrganizationOverview = {
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

export type TimesheetEntry = {
  id: number;
  task: string;
  hours: number | string;
};

export type TaskAttachment = {
  id: number;
  originalName: string;
  mimeType?: string | null;
  size: number;
  url: string;
};

export type WorkflowTask = {
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

export type WorkspacePage =
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

export type OrganizationAction = "join" | null;
