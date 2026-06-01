import { KpiCard, StatusRow } from "./components";
import type { DashboardController } from "./controllerType";
import type { WorkspacePage } from "./types";
import { formatRole } from "./utils";

type Props = { dashboard: DashboardController };

const panelClass =
  "rounded-[26px] border border-white/10 bg-[radial-gradient(circle_at_90%_10%,rgba(255,255,255,0.1),transparent_24%),linear-gradient(145deg,rgba(10,10,10,0.94),rgba(31,41,55,0.9))] p-[30px] shadow-[0_24px_70px_rgba(0,0,0,0.36)]";
const cardClass =
  "rounded-[22px] border border-white/10 bg-[radial-gradient(circle_at_90%_10%,rgba(255,255,255,0.1),transparent_24%),linear-gradient(145deg,rgba(10,10,10,0.94),rgba(31,41,55,0.9))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.36)]";

export function OverviewPage({ dashboard }: Props) {
  const { data, setActivePage, totals, user } = dashboard;
  const firstName = user.name.trim().split(/\s+/)[0] || "My";
  const completedCount = totals.completed.length;
  const cards = [
    { label: "Pending Tasks", value: totals.pending.length, note: "Awaiting assignment", tone: "warning", page: "taskPending" },
    { label: "Active Tasks", value: totals.active.length, note: "In progress", tone: "info", page: "taskProgress" },
    { label: "Completed Tasks", value: completedCount, note: "Logged entries", tone: "success", page: "taskCompleted" },
    { label: "Total Hours", value: totals.totalHours, note: `${totals.averageHours}h average`, tone: "neutral", page: "reports" },
  ];

  return (
    <>
      <section className={`${panelClass} flex items-center justify-between gap-6`}>
        <div>
          <p className="mb-3 text-xs font-extrabold uppercase text-zinc-300">Overview</p>
          <h1 className="mb-2 text-[38px] font-black text-white">{firstName}'s Workspace</h1>
          <p className="max-w-[720px] text-slate-300">Track your work, tasks, time, and recent activity from one focused dashboard.</p>
        </div>
        <div className="grid min-w-[180px] gap-1 rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-right">
          <span>{formatRole(user.role)}</span>
          <strong>{user.name}</strong>
          <small className="text-zinc-400">{user.email}</small>
        </div>
      </section>

      <section className="grid grid-cols-4 gap-3.5">
        {cards.map((card) => (
          <KpiCard key={card.label} {...card} onClick={() => setActivePage(card.page as WorkspacePage)} />
        ))}
      </section>

      <section className="grid grid-cols-2 gap-4">
        <div className={cardClass}>
          <div className="mb-4"><p className="text-xs font-extrabold uppercase text-zinc-400">Work Queue</p><h2 className="text-2xl font-black text-white">Task status</h2></div>
          <div className="grid gap-2.5">
            <StatusRow label="Pending review" value={totals.pending.length} />
            <StatusRow label="Active work" value={totals.active.length} />
            <StatusRow label="Completed logs" value={completedCount} />
          </div>
        </div>

        <div className={cardClass}>
          <div className="mb-4"><p className="text-xs font-extrabold uppercase text-zinc-400">Recent Activity</p><h2 className="text-2xl font-black text-white">Latest logged work</h2></div>
          <div className="grid gap-2.5">
            {data.length === 0 && <p className="text-sm text-zinc-400">No work logged yet.</p>}
            {data.slice(0, 4).map((entry) => (
              <div className="flex min-h-[58px] items-center justify-between gap-3.5 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3.5" key={entry.id}>
                <div className="grid"><strong className="text-white">{entry.task}</strong><span className="text-[13px] text-zinc-400">Completed log</span></div>
                <small className="text-[13px] text-zinc-400">{entry.hours}h</small>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
