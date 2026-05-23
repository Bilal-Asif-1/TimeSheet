import type { ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { DashboardLayout } from "./dashboard/DashboardLayout";
import { DepartmentsPage } from "./dashboard/DepartmentsPage";
import { EmployeesPage } from "./dashboard/EmployeesPage";
import { OrganizationDetailsPage } from "./dashboard/OrganizationDetailsPage";
import { OrganizationTopNav } from "./dashboard/OrganizationTopNav";
import { CreateOrganizationPage, OrganizationsPage } from "./dashboard/OrganizationsPage";
import { OverviewPage } from "./dashboard/OverviewPage";
import { ReportsPage, SettingsPage, TeamsPage } from "./dashboard/ReportsSettingsPages";
import { TaskCreatePage } from "./dashboard/TaskCreatePage";
import { TaskDetailsPage } from "./dashboard/TaskDetailsPage";
import { TaskStatusPage, TasksPage } from "./dashboard/TasksPage";
import { TimesheetsPage } from "./dashboard/TimesheetsPage";
import type { AppUser } from "./dashboard/types";
import { useDashboardController } from "./dashboard/useDashboardController";

type DashboardProps = {
  token: string;
  user: AppUser;
};

export default function Dashboard({ token, user }: DashboardProps) {
  const dashboard = useDashboardController(token, user);
  const { activePage, overview, selectedTaskId, workflowTasks } = dashboard;
  const hasOrganization = Boolean(overview.organization);
  const organizationPages = ["createTask", "createOrganization", "organizationDetails", "employees", "teams", "departments"];
  const isOrganizationArea = organizationPages.includes(activePage);
  const showOrganizationTopNav = isOrganizationArea && activePage !== "createTask";
  const selectedTask = workflowTasks.find((task) => task.id === selectedTaskId) || null;
  const organizationElement = (element: ReactElement) => (hasOrganization ? element : <OrganizationsPage dashboard={dashboard} />);
  const taskDetailElement = selectedTask ? <TaskDetailsPage dashboard={dashboard} task={selectedTask} /> : <TaskLoadingPage />;

  return (
    <DashboardLayout
      activePage={activePage}
      hasOrganization={hasOrganization}
      isOrganizationArea={isOrganizationArea}
      showOrganizationTopNav={showOrganizationTopNav}
      user={user}
    >
      {showOrganizationTopNav && (
        <OrganizationTopNav activePage={activePage} hasOrganization={hasOrganization} />
      )}

      <Routes>
        <Route index element={<OverviewPage dashboard={dashboard} />} />
        <Route path="tasks" element={<TasksPage dashboard={dashboard} />} />
        <Route path="tasks/create" element={<TaskCreatePage dashboard={dashboard} />} />
        <Route path="tasks/pending" element={<TaskStatusPage dashboard={dashboard} page="taskPending" />} />
        <Route path="tasks/in-progress" element={<TaskStatusPage dashboard={dashboard} page="taskProgress" />} />
        <Route path="tasks/completed" element={<TaskStatusPage dashboard={dashboard} page="taskCompleted" />} />
        <Route path="tasks/:taskId" element={taskDetailElement} />
        <Route path="organizations" element={<OrganizationsPage dashboard={dashboard} />} />
        <Route path="organizations/create" element={<CreateOrganizationPage dashboard={dashboard} />} />
        <Route path="organizations/current" element={organizationElement(<OrganizationDetailsPage dashboard={dashboard} />)} />
        <Route path="organizations/teams" element={organizationElement(<TeamsPage dashboard={dashboard} />)} />
        <Route path="organizations/departments" element={organizationElement(<DepartmentsPage dashboard={dashboard} />)} />
        <Route path="organizations/employees" element={organizationElement(<EmployeesPage dashboard={dashboard} />)} />
        <Route path="reports" element={<ReportsPage dashboard={dashboard} />} />
        <Route path="settings" element={<SettingsPage dashboard={dashboard} />} />
        <Route path="timesheets" element={<TimesheetsPage dashboard={dashboard} />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  );
}

function TaskLoadingPage() {
  return (
    <section className="workspace-grid single-panel task-status-page">
      <div className="workspace-card">
        <p className="eyebrow">Task Details</p>
        <h2>Loading task</h2>
        <p className="muted">We are opening this task from the current workspace.</p>
      </div>
    </section>
  );
}
