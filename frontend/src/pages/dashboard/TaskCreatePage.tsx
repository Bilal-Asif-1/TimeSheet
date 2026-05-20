import type { DashboardController } from "./controllerType";
import type { WorkflowTask } from "./types";

type Props = { dashboard: DashboardController };

export function TaskCreatePage({ dashboard }: Props) {
  const { message, overview, setActivePage, setTaskForm, taskForm } = dashboard;

  return (
    <section className="workspace-grid single-panel create-task-page">
      <div className="organization-page-header">
        <div><p className="eyebrow">Task Assignment</p><h2>Create task</h2></div>
        <button className="btn btn-secondary" type="button" onClick={() => setActivePage("tasks")}>Back</button>
      </div>

      <div className="workspace-card task-create-card">
        <div className="section-heading"><div><p className="eyebrow">New Workflow Item</p><h2>Detailed task brief</h2></div></div>
        <div className="task-create-form">
          <input className="input" placeholder="Task title" value={taskForm.title} onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })} />
          <select className="input" value={taskForm.assignee} onChange={(event) => setTaskForm({ ...taskForm, assignee: event.target.value })}>
            <option value="">Assign to employee</option>
            {overview.employees.map((employee) => (
              <option key={employee.id} value={employee.id}>{employee.name} - {employee.department || "Unassigned"}</option>
            ))}
          </select>
          <textarea className="input" placeholder="Task details, expected output, context, acceptance criteria..." rows={6} value={taskForm.description} onChange={(event) => setTaskForm({ ...taskForm, description: event.target.value })} />
          <div className="task-create-row">
            <select className="input" value={taskForm.priority} onChange={(event) => setTaskForm({ ...taskForm, priority: event.target.value as WorkflowTask["priority"] })}>
              <option value="low">Low priority</option>
              <option value="medium">Medium priority</option>
              <option value="high">High priority</option>
              <option value="urgent">Urgent priority</option>
            </select>
            <input className="input" placeholder="Estimated hours" type="number" min="0" step="0.5" value={taskForm.estimate} onChange={(event) => setTaskForm({ ...taskForm, estimate: event.target.value })} />
            <input className="input" type="datetime-local" value={taskForm.deadline} onChange={(event) => setTaskForm({ ...taskForm, deadline: event.target.value })} />
          </div>
          <label className="task-file-drop">
            <span>Attach files</span>
            <small>PDF, image, ZIP, document, or supporting material. Up to 8 files.</small>
            <input id="task-attachments" multiple type="file" onChange={(event) => setTaskForm({ ...taskForm, files: event.target.files })} />
          </label>
          <button className="btn btn-primary" onClick={dashboard.createWorkflowTask} disabled={taskForm.isSaving || !overview.organization} type="button">
            {taskForm.isSaving ? "Creating Task..." : "Assign Task"}
          </button>
          {!overview.organization && <p className="muted">Select or create an organization before assigning tasks.</p>}
          {message.error && <p className="error-text">{message.error}</p>}
        </div>
      </div>
    </section>
  );
}
