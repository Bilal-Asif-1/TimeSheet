import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { getApiError } from "../../api/apiError";
import { api } from "../../api/http";
import type {
  AppUser,
  Department,
  OrganizationAction,
  OrganizationOverview,
  TimesheetEntry,
  WorkflowTask,
} from "./types";
import { formatOrganizationId, industries, pageToPath, pathToPage, teamSizes } from "./utils";

const API_BASE = String(api.defaults.baseURL || "");
const BASE_URL = "/timesheet";
const TASK_URL = "/tasks";

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
  // URL se current dashboard page aur selected task id nikali jati hai.
  const location = useLocation();
  const navigate = useNavigate();
  const activePage = pathToPage(location.pathname);
  const routeTaskId = Number(location.pathname.match(/^\/dashboard\/tasks\/(\d+)/)?.[1] || 0) || null;
  const setActivePage = useCallback(
    (page: ReturnType<typeof pathToPage>) => navigate(pageToPath(page)),
    [navigate],
  );
  const openTaskDetails = useCallback(
    (id: number) => {
      setSelectedTaskId(id);
      navigate(pageToPath("taskDetails", id));
    },
    [navigate],
  );
  // Neeche dashboard data aur tamam forms ki local state rakhi gayi hai.
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

  const failAuth = (status?: number) => {
    // Expired/invalid token par session clear karke login screen reload hoti hai.
    if (status !== 401 && status !== 403) return false;
    localStorage.removeItem("appToken");
    localStorage.removeItem("appUser");
    window.location.reload();
    return true;
  };

  const read = async <T,>(url: string, fallback: T, save: (value: T) => void) => {
    // Common GET helper success par data aur failure par safe fallback save karta hai.
    try {
      const response = await api.get<T>(url);
      save(response.data);
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      if (!failAuth(status)) console.error("Load failed:", getApiError(error));
      save(fallback);
    }
  };

  const loadTimesheets = () => read<TimesheetEntry[]>(BASE_URL, [], (payload) => setData(Array.isArray(payload) ? payload : []));
  const loadOrganization = () => read<OrganizationOverview>("/organization/overview", emptyOverview, setOverview);
  const loadWorkflowTasks = () => read<WorkflowTask[]>(TASK_URL, [], (payload) => setWorkflowTasks(Array.isArray(payload) ? payload : []));
  const reloadAll = async () => Promise.all([loadTimesheets(), loadOrganization(), loadWorkflowTasks()]);

  useEffect(() => {
    // Login token milte hi dashboard ka tamam initial data parallel load hota hai.
    reloadAll();
  }, [token]);

  useEffect(() => {
    // Har second state refresh hoti hai taake running task timer screen par update rahe.
    const timer = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const postJson = async (url: string, body: unknown, setSaving?: SaveSetter) => {
    setSaving?.(true);
    try {
      const response = await api.post(url, body);
      return response.data;
    } finally {
      setSaving?.(false);
    }
  };

  const saveSessionAndRefresh = (payload: any, nextPage?: ReturnType<typeof pathToPage>) => {
    // Organization create/select ke baad naya token save karke relevant page reload hota hai.
    localStorage.setItem("appToken", payload.token);
    localStorage.setItem("appUser", JSON.stringify(payload.user));
    window.setTimeout(() => {
      window.location.href = nextPage ? pageToPath(nextPage) : window.location.pathname;
    }, 400);
  };

  const createOrganization = async () => {
    if (!organization.name.trim() || !organization.id.trim()) return setMessage({ error: "Organization name and ID are required.", success: "" });
    try {
      setMessage({ error: "", success: "" });
      const payload = await postJson("/organization/create", {
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
      const payload = await postJson("/auth/join-organization", { organizationId: join.orgId, department: join.department });
      saveSessionAndRefresh(payload, "organizationDetails");
    } catch (error) {
      setMessage({ error: (error as Error).message, success: "" });
    } finally {
      setJoin((value) => ({ ...value, isSaving: false }));
    }
  };

  const selectOrganization = async (organizationId: number | string, nextPage: ReturnType<typeof pathToPage> = "organizationDetails") => {
    try {
      const payload = await postJson("/organization/select", { organizationId });
      saveSessionAndRefresh(payload, nextPage);
    } catch (error) {
      setMessage({ error: (error as Error).message, success: "" });
    }
  };

  const saveDepartment = async () => {
    if (!department.name.trim()) return setMessage({ error: "Department name is required.", success: "" });
    setDepartment((value) => ({ ...value, isSaving: true }));
    await postJson("/organization/departments", { name: department.name, description: department.description });
    setDepartment((value) => ({ ...value, name: "", description: "", isSaving: false }));
    await loadOrganization();
  };

  const updateDepartment = async () => {
    if (!department.editId || !department.editName.trim()) return;
    await api.put(`/organization/departments/${department.editId}`, { name: department.editName, description: department.editDescription });
    setDepartment((value) => ({ ...value, editId: null, editName: "", editDescription: "" }));
    await loadOrganization();
  };

  const deleteDepartment = async (id: number) => {
    await api.delete(`/organization/departments/${id}`);
    await loadOrganization();
  };

  const startDepartmentEdit = (item: Department) => {
    setDepartment((value) => ({ ...value, editId: item.id, editName: item.name, editDescription: item.description || "" }));
  };

  const createWorkflowTask = async () => {
    // Files ki wajah se task JSON ke bajaye FormData ke zariye backend ko bheja jata hai.
    if (!taskForm.title.trim() || !taskForm.assignee) return setMessage({ error: "Task title and assignee are required.", success: "" });
    const formData = new FormData();
    Object.entries({
      title: taskForm.title, description: taskForm.description, assignedTo: taskForm.assignee,
      priority: taskForm.priority, estimatedHours: taskForm.estimate, deadlineAt: taskForm.deadline,
    }).forEach(([key, value]) => formData.append(key, value));
    if (taskForm.files) Array.from(taskForm.files).forEach((file) => formData.append("attachments", file));
    setTaskForm((value) => ({ ...value, isSaving: true }));
    try {
      await api.post(TASK_URL, formData);
      setTaskForm({ title: "", description: "", assignee: "", priority: "medium", estimate: "", deadline: "", files: null, isSaving: false });
      await loadWorkflowTasks();
      setActivePage("tasks");
    } catch (error) {
      setMessage({ error: getApiError(error, "Unable to create task."), success: "" });
      setTaskForm((value) => ({ ...value, isSaving: false }));
    }
  };

  const runTaskAction = async (taskId: number, action: "start" | "stop") => {
    // Start/stop ke baad tasks reload hote hain taake timer status fresh rahe.
    try {
      await api.post(`${TASK_URL}/${taskId}/${action}`);
      await loadWorkflowTasks();
    } catch (error) {
      setMessage({ error: getApiError(error, "Task action failed."), success: "" });
    }
  };

  const completeTask = async (taskId: number) => {
    if (!completion.report.trim()) return setMessage({ error: "Completion report is required.", success: "" });
    try {
      await api.post(`${TASK_URL}/${taskId}/complete`, { completionReport: completion.report, blockers: completion.blockers });
    } catch (error) {
      return setMessage({ error: getApiError(error, "Unable to complete task."), success: "" });
    }
    setCompletion({ taskId: null, report: "", blockers: "" });
    await loadWorkflowTasks();
  };

  const saveTimesheet = async () => {
    if (!timesheet.task.trim() || !timesheet.hours) return;
    setIsSavingTimesheet(true);
    await api.post(BASE_URL, { task: timesheet.task, hours: Number(timesheet.hours) });
    setTimesheet((value) => ({ ...value, task: "", hours: "" }));
    await reloadAll();
    setIsSavingTimesheet(false);
  };

  const deleteTimesheet = async (id: number) => {
    await api.delete(`${BASE_URL}/${id}`);
    await reloadAll();
  };

  const updateTimesheet = async () => {
    if (!timesheet.editTask.trim() || !timesheet.editHours || timesheet.editId === null) return;
    setIsSavingTimesheet(true);
    await api.put(`${BASE_URL}/${timesheet.editId}`, { task: timesheet.editTask, hours: Number(timesheet.editHours) });
    setTimesheet((value) => ({ ...value, editId: null, editTask: "", editHours: "" }));
    await reloadAll();
    setIsSavingTimesheet(false);
  };

  const totals = useMemo(() => {
    // Raw tasks/timesheets se dashboard KPI values sirf data change par calculate hoti hain.
    const totalHours = data.reduce((sum, item) => sum + Number(item.hours || 0), 0);
    const pending = workflowTasks.filter((item) => item.status === "pending");
    const active = workflowTasks.filter((item) => item.status === "in_progress");
    const completed = workflowTasks.filter((item) => item.status === "completed");
    const averageHours = completed.length > 0 ? Math.round((totalHours / completed.length) * 10) / 10 : 0;
    return { totalHours, pending, active, completed, averageHours };
  }, [data, workflowTasks]);

  return {
    activePage, setActivePage, openTaskDetails, data, overview, workflowTasks, selectedTaskId: routeTaskId ?? selectedTaskId, setSelectedTaskId,
    selectedEmployeeId, setSelectedEmployeeId, user, message, setMessage, timesheet, setTimesheet,
    organization, setOrganization, join, setJoin, department, setDepartment, taskForm, setTaskForm,
    completion, setCompletion, isSavingTimesheet, totals, apiBase: API_BASE,
    createOrganization, joinOrganization, selectOrganization, saveDepartment, updateDepartment,
    deleteDepartment, startDepartmentEdit, createWorkflowTask, runTaskAction, completeTask,
    saveTimesheet, deleteTimesheet, updateTimesheet, formatOrganizationId,
  };
}
