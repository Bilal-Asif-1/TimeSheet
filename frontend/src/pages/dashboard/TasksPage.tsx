import { InfoTile } from "./components";
import type { DashboardController } from "./controllerType";
import { TaskCard } from "./TaskCard";
import type { WorkflowTask, WorkspacePage } from "./types";

type Props = { dashboard: DashboardController };

export function TasksPage({ dashboard }: Props) {
  const { setActivePage, totals, workflowTasks, user } = dashboard;
  const assignedToMe = workflowTasks.filter((item) => item.assignedTo.id === user.id);
  const createdByMe = workflowTasks.filter((item) => item.assignedBy.id === user.id);

  return (
    <>
      <section className="workspace-grid single-panel task-toolbar-grid">
        <div className="workspace-card task-toolbar-card">
          <div className="section-heading">
            <div><p className="eyebrow">Workflow</p><h2>Task control center</h2></div>
            <button className="btn btn-primary" onClick={() => setActivePage("createTask")} type="button">Create Task</button>
          </div>
          <div className="task-insight-grid">
            <InfoTile className="task-kpi-tile" label="Assigned to me" value={String(assignedToMe.length)} />
            <InfoTile className="task-kpi-tile" label="Created by me" value={String(createdByMe.length)} />
            <InfoTile className="task-kpi-tile" label="Running now" value={String(totals.active.length)} />
            <InfoTile className="task-kpi-tile" label="Completed" value={String(totals.completed.length)} />
          </div>
        </div>
      </section>

      <section className="workspace-grid task-summary-grid">
        <Summary title="Pending" count={totals.pending.length} text="New assignments waiting to be started." onClick={() => setActivePage("taskPending")} />
        <Summary title="In progress" count={totals.active.length} text="Running work with active timers." onClick={() => setActivePage("taskProgress")} />
        <Summary title="Completed" count={totals.completed.length} text="Submitted work reports and finished tasks." onClick={() => setActivePage("taskCompleted")} />
      </section>
    </>
  );
}

export function TaskStatusPage({ dashboard, page }: Props & { page: "taskPending" | "taskProgress" | "taskCompleted" }) {
  const map = {
    taskPending: { eyebrow: "Pending Tasks", title: "Pending", empty: "No pending tasks yet.", items: dashboard.totals.pending },
    taskProgress: { eyebrow: "Active Tasks", title: "In progress", empty: "No active work right now.", items: dashboard.totals.active },
    taskCompleted: { eyebrow: "Completed Tasks", title: "Completed", empty: "Completed task reports will show here.", items: dashboard.totals.completed },
  };
  const current = map[page];

  const openTask = (task: WorkflowTask) => {
    dashboard.openTaskDetails(task.id);
  };

  return (
    <section className="workspace-grid single-panel task-status-page">
      <div className="organization-page-header">
        <div><p className="eyebrow">{current.eyebrow}</p><h2>{current.title}</h2></div>
        <button className="btn btn-secondary" type="button" onClick={() => dashboard.setActivePage("tasks")}>Back</button>
      </div>
      <div className="workspace-card task-list-card">
        <div className="task-detail-list">
          {current.items.length === 0 && <p className="muted">{current.empty}</p>}
          {current.items.map((item) => (
            <TaskCard
              activeOrganizationId={dashboard.overview.organization?.id}
              item={item}
              key={item.id}
              onOpen={openTask}
              onSwitchOrganization={(id, nextPage: WorkspacePage) => dashboard.selectOrganization(id, nextPage)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function Summary({ count, onClick, text, title }: { count: number; onClick: () => void; text: string; title: string }) {
  return (
    <button className="workspace-card task-summary-card" onClick={onClick} type="button">
      <span>Tasks</span>
      <strong>{title}</strong>
      <small>{count}</small>
      <p>{text}</p>
    </button>
  );
}
