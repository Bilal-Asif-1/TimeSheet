import { useEffect, useState } from "react";

const BASE_URL = "http://localhost:5001/timesheet";

export default function Dashboard() {
  const [data, setData] = useState<any[]>([]);
  const [task, setTask] = useState("");
  const [hours, setHours] = useState("");

  const [editId, setEditId] = useState<number | null>(null);
  const [editTask, setEditTask] = useState("");
  const [editHours, setEditHours] = useState("");

  const load = async () => {
    const res = await fetch(BASE_URL);
    setData(await res.json());
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task, hours: Number(hours) }),
    });

    setTask("");
    setHours("");
    load();
  };

  const remove = async (id: number) => {
    await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
    load();
  };

  const update = async () => {
    await fetch(`${BASE_URL}/${editId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        task: editTask,
        hours: Number(editHours),
      }),
    });

    setEditId(null);
    setEditTask("");
    setEditHours("");
    load();
  };

  return (
    <div>
      <h2>Dashboard</h2>

      {/* ADD FORM */}
      <input
        placeholder="Task"
        value={task}
        onChange={(e) => setTask(e.target.value)}
      />

      <input
        placeholder="Hours"
        type="number"
        value={hours}
        onChange={(e) => setHours(e.target.value)}
      />

      <button onClick={add}>Add</button>

      <hr />

      {/* LIST + EDIT */}
      {data.map((item) => (
        <div key={item.id}>
          {editId === item.id ? (
            <>
              <input
                value={editTask}
                onChange={(e) => setEditTask(e.target.value)}
              />

              <input
                value={editHours}
                type="number"
                onChange={(e) => setEditHours(e.target.value)}
              />

              <button onClick={update}>Save</button>
            </>
          ) : (
            <>
              {item.task} - {item.hours}
              <button
                onClick={() => {
                  setEditId(item.id);
                  setEditTask(item.task);
                  setEditHours(item.hours);
                }}
              >
                Edit
              </button>
              <button onClick={() => remove(item.id)}>Delete</button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
