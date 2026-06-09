import type { ReactNode } from "react";
import { Button, Card, Field, PageHeader, SelectField, TextAreaField } from "../../components/ui";
import type { DashboardController } from "./controllerType";
import type { WorkflowTask } from "./types";
import { formatRole } from "./utils";

type Props = { dashboard: DashboardController };

export function TaskCreatePage({ dashboard }: Props) {
  const { message, overview, setActivePage, setTaskForm, taskForm, user } = dashboard;
  // FileList ko array mein badal kar selected file names preview kiye jate hain.
  const selectedFiles = taskForm.files ? Array.from(taskForm.files) : [];
  const teamMembers = overview.employees.filter((employee) => employee.id !== user.id);
  const currentUser = overview.employees.find((employee) => employee.id === user.id);
  const selectedAssignee = overview.employees.find(
    (employee) => String(employee.id) === taskForm.assignee,
  );

  return (
    <section className="mx-auto grid w-full max-w-[880px] gap-4">
      <PageHeader
        eyebrow="Task Assignment"
        title="Create task"
        action={<Button onClick={() => setActivePage("tasks")}>Back</Button>}
      />

      <Card>
        <div className="mb-5">
          <p className="text-xs font-extrabold uppercase text-zinc-400">New Workflow Item</p>
          <h2 className="text-2xl font-black text-white">Detailed task brief</h2>
          <p className="mt-2 text-sm text-zinc-400">Add the task, assign the person, set deadline, and attach any supporting files.</p>
        </div>
        <div className="grid gap-5">
          <FormSection title="1. Task basics">
          <Field placeholder="Task title" value={taskForm.title} onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })} />
          <SelectField value={taskForm.assignee} onChange={(event) => setTaskForm({ ...taskForm, assignee: event.target.value })}>
            <option value="">Assign to employee</option>
            <optgroup label="Team members">
              {teamMembers.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} - {employee.email} - {formatRole(employee.role)}
                </option>
              ))}
            </optgroup>
            {currentUser && (
              <optgroup label="Self assignment">
                <option value={currentUser.id}>
                  Assign to myself - {currentUser.email}
                </option>
              </optgroup>
            )}
          </SelectField>
          {selectedAssignee && (
            <p className="text-sm text-zinc-400">
              Assigning to:{" "}
              <strong className="text-white">
                {selectedAssignee.name} ({selectedAssignee.email})
              </strong>
            </p>
          )}
          <TextAreaField placeholder="Task details, expected output, context, acceptance criteria..." rows={6} value={taskForm.description} onChange={(event) => setTaskForm({ ...taskForm, description: event.target.value })} />
          </FormSection>

          <FormSection title="2. Priority and timing">
          <div className="grid gap-3 md:grid-cols-3">
            <SelectField value={taskForm.priority} onChange={(event) => setTaskForm({ ...taskForm, priority: event.target.value as WorkflowTask["priority"] })}>
              <option value="low">Low priority</option>
              <option value="medium">Medium priority</option>
              <option value="high">High priority</option>
              <option value="urgent">Urgent priority</option>
            </SelectField>
            <Field placeholder="Estimated hours" type="number" min="0" step="0.5" value={taskForm.estimate} onChange={(event) => setTaskForm({ ...taskForm, estimate: event.target.value })} />
            <Field type="datetime-local" value={taskForm.deadline} onChange={(event) => setTaskForm({ ...taskForm, deadline: event.target.value })} />
          </div>
          </FormSection>

          <FormSection title="3. Attachments">
          <label className="grid cursor-pointer gap-1 rounded-2xl border border-dashed border-white/20 bg-white/[0.06] p-4 text-white">
            <span className="font-extrabold">Attach files</span>
            <small className="text-zinc-400">PDF, image, ZIP, document, or supporting material. Up to 8 files.</small>
            <input id="task-attachments" multiple type="file" onChange={(event) => setTaskForm({ ...taskForm, files: event.target.files })} />
          </label>
          {selectedFiles.length > 0 && (
            <div className="grid gap-2 rounded-2xl border border-white/10 bg-black/20 p-3">
              {selectedFiles.map((file) => <span className="text-sm text-zinc-300" key={`${file.name}-${file.size}`}>{file.name}</span>)}
            </div>
          )}
          </FormSection>

          <Button tone="primary" onClick={dashboard.createWorkflowTask} disabled={taskForm.isSaving || !overview.organization}>
            {taskForm.isSaving ? "Creating Task..." : "Assign Task"}
          </Button>
          {!overview.organization && <p className="text-sm text-zinc-400">Select or create an organization before assigning tasks.</p>}
          {message.error && <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-200">{message.error}</p>}
        </div>
      </Card>
    </section>
  );
}

function FormSection({ children, title }: { children: ReactNode; title: string }) {
  // Long task form ko readable numbered sections mein divide karta hai.
  return (
    <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <h3 className="text-sm font-black uppercase text-zinc-300">{title}</h3>
      {children}
    </div>
  );
}
