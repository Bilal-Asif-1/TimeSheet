import { Badge, Button, Card, PageHeader, TextAreaField } from "../../components/ui";
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
  const canShowActions = task.status !== "completed" && isMine;

  return (
    <section className="grid w-full gap-4">
      <PageHeader eyebrow="Task Details" title={task.title} action={<Button onClick={() => setActivePage(backPage)}>Back</Button>} />

      <Card className="grid gap-5 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge>{task.priority}</Badge>
            <Badge className="text-zinc-200">{task.status.replace("_", " ")}</Badge>
          </div>
          <small className="text-zinc-400">{formatDate(task.deadlineAt)}</small>
        </div>
        <button className="w-fit rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-extrabold text-zinc-200 transition hover:bg-white/15" onClick={() => setActivePage("organizationDetails")} type="button">
          {task.organization.name} · {task.organization.orgCode}
        </button>
        <strong className="text-2xl">{task.title}</strong>
        {task.description && <p className="text-zinc-300">{task.description}</p>}
        <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4 sm:grid-cols-3">
          <Info label="Assigned to" value={task.assignedTo.name} />
          <Info label="Created by" value={task.assignedBy.name} />
          <Info label="Tracked time" value={formatDuration(trackedSeconds)} />
        </div>
        <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 sm:grid-cols-3">
          <Info label="Estimated hours" value={task.estimatedHours ? `${task.estimatedHours}h` : "Not set"} />
          <Info label="Created date" value={formatDate(task.createdAt)} />
          <Info label="Deadline" value={formatDate(task.deadlineAt)} />
        </div>
        {task.attachments.length > 0 && (
          <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <span className="text-xs font-black uppercase text-zinc-400">Attachments</span>
            {task.attachments.map((attachment) => (
              <a className="text-sm font-bold text-blue-200 underline" href={`${apiBase}${attachment.url}`} key={attachment.id} rel="noreferrer" target="_blank">{attachment.originalName}</a>
            ))}
          </div>
        )}
        {canShowActions && (
          <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <div>
              <span className="text-xs font-black uppercase text-zinc-400">Work controls</span>
              <p className="mt-1 text-sm text-zinc-400">Start the timer when you begin, stop it when you pause, then end the task to submit your report.</p>
            </div>
            <div className="flex flex-wrap gap-3">
            {task.startedAt ? (
              <Button onClick={() => dashboard.runTaskAction(task.id, "stop")}>Stop Task</Button>
            ) : (
              <Button tone="primary" onClick={() => dashboard.runTaskAction(task.id, "start")}>Start Task</Button>
            )}
            <Button onClick={() => setCompletion({ ...completion, taskId: task.id })}>End Task</Button>
            </div>
          </div>
        )}
        {completion.taskId === task.id && (
          <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <TextAreaField placeholder="Write your completion report..." rows={4} value={completion.report} onChange={(event) => setCompletion({ ...completion, report: event.target.value })} />
            <TextAreaField placeholder="Blockers or issues faced (optional)" rows={3} value={completion.blockers} onChange={(event) => setCompletion({ ...completion, blockers: event.target.value })} />
            <div className="flex flex-wrap gap-3">
              <Button tone="primary" onClick={() => dashboard.completeTask(task.id)}>Submit Report</Button>
              <Button onClick={() => setCompletion({ taskId: null, report: "", blockers: "" })}>Cancel</Button>
            </div>
          </div>
        )}
        {task.status === "completed" && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <span className="text-xs font-black uppercase text-zinc-400">Submitted report</span>
            <p>{task.completionReport || "No report text."}</p>
            {task.blockers && <small className="text-zinc-400">Issues: {task.blockers}</small>}
          </div>
        )}
      </Card>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs font-black uppercase text-zinc-500">{label}</span>
      <strong className="mt-1 block text-sm text-white">{value}</strong>
    </div>
  );
}
