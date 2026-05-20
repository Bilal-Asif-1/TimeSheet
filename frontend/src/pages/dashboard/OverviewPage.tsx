import { KpiCard, StatusRow } from "./components";
import type { DashboardController } from "./controllerType";
import type { WorkspacePage } from "./types";
import { formatRole } from "./utils";

type Props = { dashboard: DashboardController };

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
      <section className="workspace-hero-panel personal-hero-panel overview-hero-panel">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>{firstName}'s Workspace</h1>
          <p className="workspace-hero-copy">Track your work, tasks, time, and recent activity from one focused dashboard.</p>
        </div>
        <div className="workspace-hero-meta">
          <span>{formatRole(user.role)}</span>
          <strong>{user.name}</strong>
          <small>{user.email}</small>
        </div>
      </section>

      <section className="dashboard-kpi-grid overview-kpi-grid">
        {cards.map((card) => (
          <KpiCard key={card.label} {...card} onClick={() => setActivePage(card.page as WorkspacePage)} />
        ))}
      </section>

      <section className="workspace-grid overview-ops-grid">
        <div className="workspace-card overview-card">
          <div className="section-heading"><div><p className="eyebrow">Work Queue</p><h2>Task status</h2></div></div>
          <div className="status-list">
            <StatusRow label="Pending review" value={totals.pending.length} />
            <StatusRow label="Active work" value={totals.active.length} />
            <StatusRow label="Completed logs" value={completedCount} />
          </div>
        </div>

        <div className="workspace-card overview-card">
          <div className="section-heading"><div><p className="eyebrow">Recent Activity</p><h2>Latest logged work</h2></div></div>
          <div className="recent-work-list">
            {data.length === 0 && <p className="muted">No work logged yet.</p>}
            {data.slice(0, 4).map((entry) => (
              <div className="recent-work-item" key={entry.id}>
                <div><strong>{entry.task}</strong><span>Completed log</span></div>
                <small>{entry.hours}h</small>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
