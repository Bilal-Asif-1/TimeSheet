import { useEffect, useState } from "react";

const BASE_URL = "http://localhost:5001/timesheet";

type DashboardProps = {
  token: string;
  user: { id: number; name: string; email: string; provider: "local" | "microsoft" };
};

export default function Dashboard({ token, user }: DashboardProps) {
  const [data, setData] = useState<any[]>([]);
  const [task, setTask] = useState("");
  const [hours, setHours] = useState("");

  const [editId, setEditId] = useState<number | null>(null);
  const [editTask, setEditTask] = useState("");
  const [editHours, setEditHours] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const load = async () => {
    const res = await fetch(BASE_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    setData(await res.json());
  };

  useEffect(() => {
    load();
  }, [token]);

  const add = async () => {
    if (!task.trim() || !hours) {
      return;
    }

    setIsSaving(true);
    await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ task, hours: Number(hours) }),
    });

    setTask("");
    setHours("");
    await load();
    setIsSaving(false);
  };

  const remove = async (id: number) => {
    await fetch(`${BASE_URL}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    load();
  };

  const update = async () => {
    if (!editTask.trim() || !editHours || editId === null) {
      return;
    }

    setIsSaving(true);
    await fetch(`${BASE_URL}/${editId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        task: editTask,
        hours: Number(editHours),
      }),
    });

    setEditId(null);
    setEditTask("");
    setEditHours("");
    await load();
    setIsSaving(false);
  };

  const totalHours = data.reduce((sum, item) => sum + Number(item.hours || 0), 0);

  return (
    <div className="dashboard-wrap">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>{user.name}'s Timesheet</h1>
        </div>
        <div className="pill">
          Total hours: <strong>{totalHours}</strong>
        </div>
      </div>

      <div className="card add-form">
        <input
          className="input"
          id="task"
          name="task"
          placeholder="Task"
          value={task}
          onChange={(e) => setTask(e.target.value)}
        />

        <input
          className="input"
          id="hours"
          name="hours"
          placeholder="Hours"
          type="number"
          min={0}
          value={hours}
          onChange={(e) => setHours(e.target.value)}
        />

        <button className="btn btn-primary" onClick={add} disabled={isSaving}>
          {isSaving ? "Saving..." : "Add entry"}
        </button>
      </div>

      <div className="list">
        {data.length === 0 && <p className="muted">No entries yet. Add your first task above.</p>}

        {data.map((item) => (
          <div key={item.id} className="card list-item">
            {editId === item.id ? (
              <div className="edit-grid">
                <input
                  className="input"
                  id={`edit-task-${item.id}`}
                  name={`editTask-${item.id}`}
                  value={editTask}
                  onChange={(e) => setEditTask(e.target.value)}
                />

                <input
                  className="input"
                  id={`edit-hours-${item.id}`}
                  name={`editHours-${item.id}`}
                  value={editHours}
                  type="number"
                  min={0}
                  onChange={(e) => setEditHours(e.target.value)}
                />

                <button className="btn btn-primary" onClick={update} disabled={isSaving}>
                  Save
                </button>
              </div>
            ) : (
              <div className="row">
                <div>
                  <p className="task-name">{item.task}</p>
                  <p className="muted">{item.hours} hours</p>
                </div>
                <div className="actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setEditId(item.id);
                      setEditTask(item.task);
                      setEditHours(String(item.hours));
                    }}
                  >
                    Edit
                  </button>
                  <button className="btn btn-danger" onClick={() => remove(item.id)}>
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
