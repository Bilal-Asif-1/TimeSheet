import type { DashboardController } from "./controllerType";

type Props = { dashboard: DashboardController };

export function TimesheetsPage({ dashboard }: Props) {
  const { data, isSavingTimesheet, setTimesheet, timesheet, totals } = dashboard;

  return (
    <section className="workspace-card">
      <div className="section-heading">
        <div><p className="eyebrow">Timesheets</p><h2>My time entries</h2></div>
        <div className="pill">Total hours: <strong>{totals.totalHours}</strong></div>
      </div>

      <div className="add-form">
        <input className="input" placeholder="Task" value={timesheet.task} onChange={(event) => setTimesheet({ ...timesheet, task: event.target.value })} />
        <input className="input" placeholder="Hours" type="number" min={0} value={timesheet.hours} onChange={(event) => setTimesheet({ ...timesheet, hours: event.target.value })} />
        <button className="btn btn-primary" onClick={dashboard.saveTimesheet} disabled={isSavingTimesheet}>
          {isSavingTimesheet ? "Saving..." : "Add entry"}
        </button>
      </div>

      <div className="list">
        {data.length === 0 && <p className="muted">No entries yet. Add your first task above.</p>}
        {data.map((item) => (
          <div key={item.id} className="list-item timesheet-row-card">
            {timesheet.editId === item.id ? (
              <div className="edit-grid">
                <input className="input" value={timesheet.editTask} onChange={(event) => setTimesheet({ ...timesheet, editTask: event.target.value })} />
                <input className="input" value={timesheet.editHours} type="number" min={0} onChange={(event) => setTimesheet({ ...timesheet, editHours: event.target.value })} />
                <button className="btn btn-primary" onClick={dashboard.updateTimesheet} disabled={isSavingTimesheet}>Save</button>
              </div>
            ) : (
              <div className="row">
                <div><p className="task-name">{item.task}</p><p className="muted">{item.hours} hours</p></div>
                <div className="actions">
                  <button className="btn btn-secondary" onClick={() => setTimesheet({ ...timesheet, editId: item.id, editTask: item.task, editHours: String(item.hours) })}>Edit</button>
                  <button className="btn btn-danger" onClick={() => dashboard.deleteTimesheet(item.id)}>Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
