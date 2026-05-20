import type { WorkflowTask, WorkspacePage } from "./types";
import { formatDate, formatDuration } from "./utils";

type Props = {
  activeOrganizationId?: number;
  item: WorkflowTask;
  onOpen: (task: WorkflowTask) => void;
  onSwitchOrganization: (organizationId: number, nextPage: WorkspacePage) => void;
};

export function TaskCard({ activeOrganizationId, item, onOpen, onSwitchOrganization }: Props) {
  const isActiveOrganization = item.organization.id === activeOrganizationId;
  const nextPage = item.status === "pending" ? "taskPending" : item.status === "in_progress" ? "taskProgress" : "taskCompleted";
  const runningSeconds = item.startedAt ? Math.floor((Date.now() - new Date(item.startedAt).getTime()) / 1000) : 0;
  const trackedSeconds = item.totalSeconds + runningSeconds;

  const openTask = () => {
    if (isActiveOrganization) onOpen(item);
    else onSwitchOrganization(item.organization.id, nextPage);
  };

  return (
    <div className={`task-board-card workflow-task-card priority-${item.priority}`} onClick={openTask} role="button" tabIndex={0}>
      <div className="workflow-task-card-top">
        <span>{item.priority}</span>
        <small>{formatDate(item.deadlineAt)}</small>
      </div>
      <button
        className="task-org-chip"
        onClick={(event) => {
          event.stopPropagation();
          if (isActiveOrganization) openTask();
          else onSwitchOrganization(item.organization.id, nextPage);
        }}
        type="button"
      >
        {item.organization.name} · {item.organization.orgCode}
      </button>
      <strong>{item.title}</strong>
      <div className="workflow-task-meta compact">
        <span>{item.assignedTo.name}</span>
        <span>{formatDuration(trackedSeconds)}</span>
      </div>
    </div>
  );
}
