import { useEffect, useMemo, useRef, useState } from "react";
import { getApiBaseUrl } from "../../config/env";
import type {
  AppUser,
  Department,
  OrganizationAction,
  OrganizationOverview,
  TimesheetEntry,
  WorkflowTask,
  WorkspacePage,
} from "./types";
import { allDashboardPages, formatOrganizationId, industries, pendingDashboardPages, teamSizes } from "./utils";

const API_BASE = getApiBaseUrl();
const BASE_URL = `${API_BASE}/timesheet`;
const TASK_URL = `${API_BASE}/tasks`;

export const emptyOverview: OrganizationOverview = {
  organization: null,
  memberships: [],
  ownedOrganizations: [],
  joinedOrganizations: [],
  departments: [],
  employees: [],
  stats: { employees: 0, departments: 0, totalHours: 0, activeRoles: 0 },
};

type SaveSetter = (value: boolean) => void;

export function useDashboardController(token: string, user: AppUser) {
  const [activePage, setActivePage] = useState<WorkspacePage>(() => {
    const pending = localStorage.getItem("pendingDashboardPage") as WorkspacePage | null;
    if (pending && pendingDashboardPages.includes(pending)) {
      localStorage.removeItem("pendingDashboardPage");
      return pending;
    }
    return "overview";
  });
  const historyReady = useRef(false);
  const browserBack = useRef(false);
  const [data, setData] = useState<TimesheetEntry[]>([]);
  const [overview, setOverview] = useState<OrganizationOverview>(emptyOverview);
  const [workflowTasks, setWorkflowTasks] = useState<WorkflowTask[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [_tick, setTick] = useState(0);
  const [message, setMessage] = useState({ error: "", success: "" });

  const [timesheet, setTimesheet] = useState({ task: "", hours: "", editId: null as number | null, editTask: "", editHours: "" });
  const [organization, setOrganization] = useState({ name: "", id: "", industry: industries[0], teamSize: teamSizes[1], action: null as OrganizationAction });
  const [join, setJoin] = useState({ orgId: "", department: user.department || "", isSaving: false });
  const [department, setDepartment] = useState({
    name: "", description: "", isSaving: false, editId: null as number | null, editName: "", editDescription: "",
  });
  const [taskForm, setTaskForm] = useState({
    title: "", description: "", assignee: "", priority: "medium" as WorkflowTask["priority"],
    estimate: "", deadline: "", files: null as FileList | null, isSaving: false,
  });
  const [completion, setCompletion] = useState({ taskId: null as number | null, report: "", blockers: "" });
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [isSavingTimesheet, setIsSavingTimesheet] = useState(false);

  const authHeaders = { Authorization: `Bearer ${token}` };
  const jsonHeaders = { "Content-Type": "application/json", ...authHeaders };

  const failAuth = (status: number) => {
    if (status !== 401 && status !== 403) return false;
    localStorage.removeItem("appToken");
    localStorage.removeItem("appUser");
    window.location.reload();
    return true;
  };

  const read = async <T,>(url: string, fallback: T, save: (value: T) => void) => {
    const res = await fetch(url, { headers: authHeaders });
    const payload = await res.json();
    if (!res.ok) {
      if (!failAuth(res.status)) console.error("Load failed:", payload);
      save(fallback);
      return;
    }
    save(payload);
  };

  const loadTimesheets = () => read<TimesheetEntry[]>(BASE_URL, [], (payload) => setData(Array.isArray(payload) ? payload : []));
  const loadOrganization = () => read<OrganizationOverview>(`${API_BASE}/organization/overview`, emptyOverview, setOverview);
  const loadWorkflowTasks = () => read<WorkflowTask[]>(TASK_URL, [], (payload) => setWorkflowTasks(Array.isArray(payload) ? payload : []));
  const reloadAll = async () => Promise.all([loadTimesheets(), loadOrganization(), loadWorkflowTasks()]);

  useEffect(() => {
    reloadAll();
  }, [token]);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const state = window.history.state && typeof window.history.state === "object" ? window.history.state : {};
    if (!historyReady.current) {
      window.history.replaceState({ ...state, workspacePage: activePage }, "", window.location.href);
      historyReady.current = true;
      return;
    }
    if (browserBack.current) {
      browserBack.current = false;
      return;
    }
    window.history.pushState({ ...state, workspacePage: activePage }, "", window.location.href);
  }, [activePage]);

  useEffect(() => {
    const onBack = (event: PopStateEvent) => {
      const page = (event.state as { workspacePage?: WorkspacePage } | null)?.workspacePage;
      if (!page || !allDashboardPages.includes(page)) return;
      browserBack.current = true;
      setActivePage(page);
    };
    window.addEventListener("popstate", onBack);
    return () => window.removeEventListener("popstate", onBack);
  }, []);

  const postJson = async (url: string, body: unknown, setSaving?: SaveSetter) => {
    setSaving?.(true);
    const res = await fetch(url, { method: "POST", headers: jsonHeaders, body: JSON.stringify(body) });
    const payload = await res.json();
    setSaving?.(false);
    if (!res.ok) throw new Error(payload.error || "Request failed.");
    return payload;
  };

  const saveSessionAndRefresh = (payload: any, nextPage?: WorkspacePage) => {
    localStorage.setItem("appToken", payload.token);
    localStorage.setItem("appUser", JSON.stringify(payload.user));
    if (nextPage) localStorage.setItem("pendingDashboardPage", nextPage);
    window.setTimeout(() => window.location.reload(), 400);
  };

  const createOrganization = async () => {
    if (!organization.name.trim() || !organization.id.trim()) return setMessage({ error: "Organization name and ID are required.", success: "" });
    try {
      setMessage({ error: "", success: "" });
      const payload = await postJson(`${API_BASE}/organization/create`, {
        organizationName: organization.name, organizationId: organization.id,
        industry: organization.industry, teamSize: organization.teamSize,
      });
      setMessage({ error: "", success: `Created ${payload.organization.orgCode}. Refreshing workspace...` });
      saveSessionAndRefresh(payload, "organizationDetails");
    } catch (error) {
      setMessage({ error: (error as Error).message, success: "" });
    }
  };

  const joinOrganization = async () => {
    if (!join.orgId.trim()) return setMessage({ error: "Organization ID is required.", success: "" });
    try {
      setJoin((value) => ({ ...value, isSaving: true }));
      const payload = await postJson(`${API_BASE}/auth/join-organization`, { organizationId: join.orgId, department: join.department });
      saveSessionAndRefresh(payload, "organizationDetails");
    } catch (error) {
      setMessage({ error: (error as Error).message, success: "" });
    } finally {
      setJoin((value) => ({ ...value, isSaving: false }));
    }
  };

  const selectOrganization = async (organizationId: number | string, nextPage: WorkspacePage = "organizationDetails") => {
    try {
      const payload = await postJson(`${API_BASE}/organization/select`, { organizationId });
      saveSessionAndRefresh(payload, nextPage);
    } catch (error) {
      setMessage({ error: (error as Error).message, success: "" });
    }
  };

  const saveDepartment = async () => {
    if (!department.name.trim()) return setMessage({ error: "Department name is required.", success: "" });
    setDepartment((value) => ({ ...value, isSaving: true }));
    await postJson(`${API_BASE}/organization/departments`, { name: department.name, description: department.description });
    setDepartment((value) => ({ ...value, name: "", description: "", isSaving: false }));
    await loadOrganization();
  };

  const updateDepartment = async () => {
    if (!department.editId || !department.editName.trim()) return;
    await fetch(`${API_BASE}/organization/departments/${department.editId}`, {
      method: "PUT", headers: jsonHeaders,
      body: JSON.stringify({ name: department.editName, description: department.editDescription }),
    });
    setDepartment((value) => ({ ...value, editId: null, editName: "", editDescription: "" }));
    await loadOrganization();
  };

  const deleteDepartment = async (id: number) => {
    await fetch(`${API_BASE}/organization/departments/${id}`, { method: "DELETE", headers: authHeaders });
    await loadOrganization();
  };

  const startDepartmentEdit = (item: Department) => {
    setDepartment((value) => ({ ...value, editId: item.id, editName: item.name, editDescription: item.description || "" }));
  };

  const createWorkflowTask = async () => {
    if (!taskForm.title.trim() || !taskForm.assignee) return setMessage({ error: "Task title and assignee are required.", success: "" });
    const formData = new FormData();
    Object.entries({
      title: taskForm.title, description: taskForm.description, assignedTo: taskForm.assignee,
      priority: taskForm.priority, estimatedHours: taskForm.estimate, deadlineAt: taskForm.deadline,
    }).forEach(([key, value]) => formData.append(key, value));
    if (taskForm.files) Array.from(taskForm.files).forEach((file) => formData.append("attachments", file));
    setTaskForm((value) => ({ ...value, isSaving: true }));
    const res = await fetch(TASK_URL, { method: "POST", headers: authHeaders, body: formData });
    const payload = await res.json();
    setTaskForm((value) => ({ ...value, isSaving: false }));
    if (!res.ok) return setMessage({ error: payload.error || "Unable to create task.", success: "" });
    setTaskForm({ title: "", description: "", assignee: "", priority: "medium", estimate: "", deadline: "", files: null, isSaving: false });
    await loadWorkflowTasks();
    setActivePage("tasks");
  };

  const runTaskAction = async (taskId: number, action: "start" | "stop") => {
    const res = await fetch(`${TASK_URL}/${taskId}/${action}`, { method: "POST", headers: authHeaders });
    if (!res.ok) setMessage({ error: (await res.json()).error || "Task action failed.", success: "" });
    await loadWorkflowTasks();
  };

  const completeTask = async (taskId: number) => {
    if (!completion.report.trim()) return setMessage({ error: "Completion report is required.", success: "" });
    const res = await fetch(`${TASK_URL}/${taskId}/complete`, {
      method: "POST", headers: jsonHeaders,
      body: JSON.stringify({ completionReport: completion.report, blockers: completion.blockers }),
    });
    if (!res.ok) return setMessage({ error: (await res.json()).error || "Unable to complete task.", success: "" });
    setCompletion({ taskId: null, report: "", blockers: "" });
    await loadWorkflowTasks();
  };

  const saveTimesheet = async () => {
    if (!timesheet.task.trim() || !timesheet.hours) return;
    setIsSavingTimesheet(true);
    await fetch(BASE_URL, { method: "POST", headers: jsonHeaders, body: JSON.stringify({ task: timesheet.task, hours: Number(timesheet.hours) }) });
    setTimesheet((value) => ({ ...value, task: "", hours: "" }));
    await reloadAll();
    setIsSavingTimesheet(false);
  };

  const deleteTimesheet = async (id: number) => {
    await fetch(`${BASE_URL}/${id}`, { method: "DELETE", headers: authHeaders });
    await reloadAll();
  };

  const updateTimesheet = async () => {
    if (!timesheet.editTask.trim() || !timesheet.editHours || timesheet.editId === null) return;
    setIsSavingTimesheet(true);
    await fetch(`${BASE_URL}/${timesheet.editId}`, {
      method: "PUT", headers: jsonHeaders,
      body: JSON.stringify({ task: timesheet.editTask, hours: Number(timesheet.editHours) }),
    });
    setTimesheet((value) => ({ ...value, editId: null, editTask: "", editHours: "" }));
    await reloadAll();
    setIsSavingTimesheet(false);
  };

  const totals = useMemo(() => {
    const totalHours = data.reduce((sum, item) => sum + Number(item.hours || 0), 0);
    const pending = workflowTasks.filter((item) => item.status === "pending");
    const active = workflowTasks.filter((item) => item.status === "in_progress");
    const completed = workflowTasks.filter((item) => item.status === "completed");
    const averageHours = completed.length > 0 ? Math.round((totalHours / completed.length) * 10) / 10 : 0;
    return { totalHours, pending, active, completed, averageHours };
  }, [data, workflowTasks]);

  return {
    activePage, setActivePage, data, overview, workflowTasks, selectedTaskId, setSelectedTaskId,
    selectedEmployeeId, setSelectedEmployeeId, user, message, setMessage, timesheet, setTimesheet,
    organization, setOrganization, join, setJoin, department, setDepartment, taskForm, setTaskForm,
    completion, setCompletion, isSavingTimesheet, totals, apiBase: API_BASE,
    createOrganization, joinOrganization, selectOrganization, saveDepartment, updateDepartment,
    deleteDepartment, startDepartmentEdit, createWorkflowTask, runTaskAction, completeTask,
    saveTimesheet, deleteTimesheet, updateTimesheet, formatOrganizationId,
  };
}
