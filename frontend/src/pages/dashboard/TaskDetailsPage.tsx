import type { DashboardController } from "./controllerType";
import type { WorkflowTask } from "./types";
import { formatDate, formatDuration } from "./utils";

type Props = { dashboard: DashboardController; task: WorkflowTask };

export function TaskDetailsPage({ dashboard, task }: Props) {
  const { apiBase, completion, setActivePage, setCompletion, user } = dashboard;
  const isMine = task.assignedTo.id === user.id;
  const backPage = task.status === "pending" ? "taskPending" : task.status === "in_progress" ? "taskProgress" : "taskCompleted";
  const runningSeconds = task.startedAt ? Math.floor((Date.now() - new Date(task.startedAt).getTime()) / 1000) : 0;
  const trackedSeconds = task.totalSeconds + runningSeconds;

  return (
    <section className="workspace-grid single-panel task-status-page">
      <div className="organization-page-header">
        <div><p className="eyebrow">Task Details</p><h2>{task.title}</h2></div>
        <button className="btn btn-secondary" type="button" onClick={() => setActivePage(backPage)}>Back</button>
      </div>

      <div className={`workspace-card workflow-task-card task-detail-card priority-${task.priority}`}>
        <div className="workflow-task-card-top">
          <span>{task.priority}</span>
          <small>{formatDate(task.deadlineAt)}</small>
        </div>
        <button className="task-org-chip" onClick={() => setActivePage("organizationDetails")} type="button">
          {task.organization.name} · {task.organization.orgCode}
        </button>
        <strong>{task.title}</strong>
        {task.description && <p>{task.description}</p>}
        <div className="workflow-task-meta">
          <span>To: {task.assignedTo.name}</span>
          <span>By: {task.assignedBy.name}</span>
          <span>{formatDuration(trackedSeconds)}</span>
        </div>
        {task.attachments.length > 0 && (
          <div className="task-attachment-list">
            {task.attachments.map((attachment) => (
              <a href={`${apiBase}${attachment.url}`} key={attachment.id} rel="noreferrer" target="_blank">{attachment.originalName}</a>
            ))}
          </div>
        )}
        {task.status !== "completed" && isMine && (
          <div className="task-action-row">
            {task.startedAt ? (
              <button className="btn btn-secondary" onClick={() => dashboard.runTaskAction(task.id, "stop")} type="button">Stop Task</button>
            ) : (
              <button className="btn btn-primary" onClick={() => dashboard.runTaskAction(task.id, "start")} type="button">Start Task</button>
            )}
            <button className="btn btn-secondary" onClick={() => setCompletion({ ...completion, taskId: task.id })} type="button">End Task</button>
          </div>
        )}
        {completion.taskId === task.id && (
          <div className="completion-panel">
            <textarea className="input" placeholder="Write your completion report..." rows={4} value={completion.report} onChange={(event) => setCompletion({ ...completion, report: event.target.value })} />
            <textarea className="input" placeholder="Blockers or issues faced (optional)" rows={3} value={completion.blockers} onChange={(event) => setCompletion({ ...completion, blockers: event.target.value })} />
            <div className="task-action-row">
              <button className="btn btn-primary" onClick={() => dashboard.completeTask(task.id)} type="button">Submit Report</button>
              <button className="btn btn-secondary" onClick={() => setCompletion({ taskId: null, report: "", blockers: "" })} type="button">Cancel</button>
            </div>
          </div>
        )}
        {task.status === "completed" && (
          <div className="completion-summary">
            <span>Submitted report</span>
            <p>{task.completionReport || "No report text."}</p>
            {task.blockers && <small>Issues: {task.blockers}</small>}
          </div>
        )}
      </div>
    </section>
  );
}
