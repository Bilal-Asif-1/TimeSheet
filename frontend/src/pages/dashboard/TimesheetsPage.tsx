import type { DashboardController } from "./controllerType";

type Props = { dashboard: DashboardController };

const cardClass = "rounded-[26px] border border-white/10 bg-white/[0.05] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.32)]";
const inputClass = "w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none transition focus:border-white/35";
const primaryButton = "rounded-2xl border border-white/15 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButton = "rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15";
const dangerButton = "rounded-2xl border border-red-300/25 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-100 transition hover:bg-red-400/20";

export function TimesheetsPage({ dashboard }: Props) {
  // Timesheet data aur CRUD actions central dashboard controller provide karta hai.
  const { data, isSavingTimesheet, setTimesheet, timesheet, totals } = dashboard;

  return (
    <section className={cardClass}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-white/45">Timesheets</p>
          <h2 className="text-2xl font-semibold text-white">My time entries</h2>
        </div>
        <div className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/65">Total hours: <strong className="text-white">{totals.totalHours}</strong></div>
      </div>

      <div className="mb-6 grid gap-3 lg:grid-cols-[1.5fr_0.7fr_auto]">
        <input className={inputClass} placeholder="Task" value={timesheet.task} onChange={(event) => setTimesheet({ ...timesheet, task: event.target.value })} />
        <input className={inputClass} placeholder="Hours" type="number" min={0} value={timesheet.hours} onChange={(event) => setTimesheet({ ...timesheet, hours: event.target.value })} />
        <button className={primaryButton} onClick={dashboard.saveTimesheet} disabled={isSavingTimesheet}>
          {isSavingTimesheet ? "Saving..." : "Add entry"}
        </button>
      </div>

      <div className="grid gap-3">
        {data.length === 0 && <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/50">No entries yet. Add your first task above.</p>}
        {data.map((item) => (
          <div key={item.id} className="rounded-3xl border border-white/10 bg-black/25 p-4">
            {/* Selected editId wali entry inline edit form mein badal jati hai. */}
            {timesheet.editId === item.id ? (
              <div className="grid gap-3 lg:grid-cols-[1.5fr_0.7fr_auto]">
                <input className={inputClass} value={timesheet.editTask} onChange={(event) => setTimesheet({ ...timesheet, editTask: event.target.value })} />
                <input className={inputClass} value={timesheet.editHours} type="number" min={0} onChange={(event) => setTimesheet({ ...timesheet, editHours: event.target.value })} />
                <button className={primaryButton} onClick={dashboard.updateTimesheet} disabled={isSavingTimesheet}>Save</button>
              </div>
            ) : (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="text-base font-semibold text-white">{item.task}</p><p className="mt-1 text-sm text-white/50">{item.hours} hours</p></div>
                <div className="flex flex-wrap gap-2">
                  <button className={secondaryButton} onClick={() => setTimesheet({ ...timesheet, editId: item.id, editTask: item.task, editHours: String(item.hours) })}>Edit</button>
                  <button className={dangerButton} onClick={() => dashboard.deleteTimesheet(item.id)}>Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
