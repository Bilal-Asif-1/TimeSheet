import { InfoTile } from "./components";
import type { DashboardController } from "./controllerType";
import { TaskCard } from "./TaskCard";
import type { WorkflowTask, WorkspacePage } from "./types";

type Props = { dashboard: DashboardController };
const cardClass =
  "rounded-[22px] border border-white/10 bg-[radial-gradient(circle_at_90%_10%,rgba(255,255,255,0.1),transparent_24%),linear-gradient(145deg,rgba(10,10,10,0.94),rgba(31,41,55,0.9))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.36)]";

export function TasksPage({ dashboard }: Props) {
  const { setActivePage, totals, workflowTasks, user } = dashboard;
  const assignedToMe = workflowTasks.filter((item) => item.assignedTo.id === user.id);
  const createdByMe = workflowTasks.filter((item) => item.assignedBy.id === user.id);

  return (
    <>
      <section className="grid">
        <div className={cardClass}>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div><p className="text-xs font-extrabold uppercase text-zinc-400">Workflow</p><h2 className="text-2xl font-black text-white">Task control center</h2></div>
            <button className="min-h-11 rounded-xl bg-zinc-600 px-5 font-extrabold text-white transition hover:bg-zinc-500" onClick={() => setActivePage("createTask")} type="button">Create Task</button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <InfoTile className="task-kpi-tile" label="Assigned to me" value={String(assignedToMe.length)} />
            <InfoTile className="task-kpi-tile" label="Created by me" value={String(createdByMe.length)} />
            <InfoTile className="task-kpi-tile" label="Running now" value={String(totals.active.length)} />
            <InfoTile className="task-kpi-tile" label="Completed" value={String(totals.completed.length)} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-4">
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
    <section className="grid w-full gap-4">
      <div className="flex items-center justify-between gap-4">
        <div><p className="text-xs font-extrabold uppercase text-zinc-400">{current.eyebrow}</p><h2 className="text-2xl font-black text-white">{current.title}</h2></div>
        <button className="min-h-11 rounded-xl bg-zinc-700 px-5 font-extrabold text-white transition hover:bg-zinc-600" type="button" onClick={() => dashboard.setActivePage("tasks")}>Back</button>
      </div>
      <div className={`${cardClass} p-2.5`}>
        <div className="task-detail-list">
          {current.items.length === 0 && <p className="text-sm text-zinc-400">{current.empty}</p>}
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
    <button className={`${cardClass} grid min-h-40 gap-2 text-left text-white transition hover:border-white/30 hover:bg-white/10`} onClick={onClick} type="button">
      <span className="text-xs font-black text-zinc-400">Tasks</span>
      <strong className="text-[26px]">{title}</strong>
      <small className="grid h-[34px] w-[42px] place-items-center rounded-full border border-white/15 bg-white/10 text-sm font-black text-white">{count}</small>
      <p className="text-[13px] leading-6 text-zinc-400">{text}</p>
    </button>
  );
}
