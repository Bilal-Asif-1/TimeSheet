import { useEffect, useState } from "react";
import { getApiBaseUrl } from "../config/env";

const API_BASE = getApiBaseUrl();
const BASE_URL = `${API_BASE}/timesheet`;

type DashboardProps = {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    provider: "local" | "microsoft";
    organizationCode?: string | null;
    role?: string | null;
    department?: string | null;
  };
};

export default function Dashboard({ token, user }: DashboardProps) {
  const [data, setData] = useState<any[]>([]);
  const [task, setTask] = useState("");
  const [hours, setHours] = useState("");

  const [editId, setEditId] = useState<number | null>(null);
  const [editTask, setEditTask] = useState("");
  const [editHours, setEditHours] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [joinOrgId, setJoinOrgId] = useState("");
  const [joinDepartment, setJoinDepartment] = useState(user.department || "");
  const [joinError, setJoinError] = useState("");
  const [joinSuccess, setJoinSuccess] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const load = async () => {
    const res = await fetch(BASE_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const payload = await res.json();
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("appToken");
        localStorage.removeItem("appUser");
        window.location.reload();
        return;
      }

      console.error("Failed to load timesheets:", payload);
      setData([]);
      return;
    }

    setData(Array.isArray(payload) ? payload : []);
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

  const joinOrganization = async () => {
    if (!joinOrgId.trim()) {
      setJoinError("Organization ID is required.");
      return;
    }

    try {
      setJoinError("");
      setJoinSuccess("");
      setIsJoining(true);
      const response = await fetch(`${API_BASE}/auth/join-organization`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          organizationId: joinOrgId,
          department: joinDepartment,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to join organization.");
      }

      localStorage.setItem("appToken", payload.token);
      localStorage.setItem("appUser", JSON.stringify(payload.user));
      setJoinSuccess(`Joined ${payload.user.organizationCode}. Refreshing workspace...`);
      window.setTimeout(() => window.location.reload(), 700);
    } catch (error) {
      const err = error as Error;
      setJoinError(err.message);
    } finally {
      setIsJoining(false);
    }
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

      <div className="card workspace-join-card">
        <div>
          <p className="eyebrow">Workspace</p>
          <h2>{user.organizationCode ? `Organization ${user.organizationCode}` : "Join an organization"}</h2>
          <p className="muted">
            {user.organizationCode
              ? `Role: ${user.role || "employee"}${user.department ? ` - ${user.department}` : ""}`
              : "Enter an Organization ID after login to connect this user account to a company workspace."}
          </p>
        </div>
        <div className="join-org-controls">
          <input
            className="input"
            placeholder="ORG-X82KLM"
            value={joinOrgId}
            onChange={(event) => setJoinOrgId(event.target.value)}
          />
          <input
            className="input"
            placeholder="Department"
            value={joinDepartment}
            onChange={(event) => setJoinDepartment(event.target.value)}
          />
          <button className="btn btn-secondary" onClick={joinOrganization} disabled={isJoining}>
            {isJoining ? "Joining..." : user.organizationCode ? "Switch Organization" : "Join Organization"}
          </button>
        </div>
        {joinError && <p className="error-text">{joinError}</p>}
        {joinSuccess && <p className="success-text">{joinSuccess}</p>}
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
