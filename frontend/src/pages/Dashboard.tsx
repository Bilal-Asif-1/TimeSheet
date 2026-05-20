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
  const { activePage, overview, selectedTaskId, setActivePage, workflowTasks } = dashboard;
  const hasOrganization = Boolean(overview.organization);
  const organizationPages = ["createTask", "createOrganization", "organizationDetails", "employees", "teams", "departments"];
  const isOrganizationArea = organizationPages.includes(activePage);
  const showOrganizationTopNav = isOrganizationArea && activePage !== "createTask";
  const selectedTask = workflowTasks.find((task) => task.id === selectedTaskId) || null;

  return (
    <DashboardLayout
      activePage={activePage}
      hasOrganization={hasOrganization}
      isOrganizationArea={isOrganizationArea}
      onPageChange={setActivePage}
      showOrganizationTopNav={showOrganizationTopNav}
      user={user}
    >
      {showOrganizationTopNav && (
        <OrganizationTopNav activePage={activePage} hasOrganization={hasOrganization} onPageChange={setActivePage} />
      )}

      {activePage === "overview" && <OverviewPage dashboard={dashboard} />}
      {activePage === "tasks" && <TasksPage dashboard={dashboard} />}
      {activePage === "taskPending" && <TaskStatusPage dashboard={dashboard} page="taskPending" />}
      {activePage === "taskProgress" && <TaskStatusPage dashboard={dashboard} page="taskProgress" />}
      {activePage === "taskCompleted" && <TaskStatusPage dashboard={dashboard} page="taskCompleted" />}
      {activePage === "taskDetails" && selectedTask && <TaskDetailsPage dashboard={dashboard} task={selectedTask} />}
      {activePage === "createTask" && <TaskCreatePage dashboard={dashboard} />}

      {activePage === "myOrganization" && <OrganizationsPage dashboard={dashboard} />}
      {activePage === "createOrganization" && <CreateOrganizationPage dashboard={dashboard} />}
      {activePage === "organizationDetails" && <OrganizationDetailsPage dashboard={dashboard} />}
      {activePage === "teams" && <TeamsPage dashboard={dashboard} />}
      {activePage === "departments" && <DepartmentsPage dashboard={dashboard} />}
      {activePage === "employees" && <EmployeesPage dashboard={dashboard} />}

      {activePage === "reports" && <ReportsPage dashboard={dashboard} />}
      {activePage === "settings" && <SettingsPage dashboard={dashboard} />}
      {activePage === "timesheets" && <TimesheetsPage dashboard={dashboard} />}
      {!hasOrganization && !["overview", "tasks", "myOrganization", "reports", "settings"].includes(activePage) && (
        <OrganizationsPage dashboard={dashboard} />
      )}
    </DashboardLayout>
  );
}
