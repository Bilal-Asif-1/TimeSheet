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
    <div className="grid cursor-pointer gap-1.5 rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 text-white transition hover:border-white/30 hover:bg-white/10" onClick={openTask} role="button" tabIndex={0}>
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-black uppercase text-white">{item.priority}</span>
        <small className="text-xs text-zinc-400">{formatDate(item.deadlineAt)}</small>
      </div>
      <button
        className="w-fit rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-extrabold text-zinc-200"
        onClick={(event) => {
          event.stopPropagation();
          if (isActiveOrganization) openTask();
          else onSwitchOrganization(item.organization.id, nextPage);
        }}
        type="button"
      >
        {item.organization.name} · {item.organization.orgCode}
      </button>
      <strong className="text-base">{item.title}</strong>
      <div className="flex items-center justify-between gap-3 text-sm text-zinc-400">
        <span>{item.assignedTo.name}</span>
        <span>{formatDuration(trackedSeconds)}</span>
      </div>
    </div>
  );
}
