import { useState } from "react";

function Dashboard() {
  const [task, setTask] = useState("");
  const [hours, setHours] = useState<number>(0);
  const [list, setList] = useState<{ task: string; hours: number }[]>([]);

  const addEntry = async () => {
    if (!task || hours <= 0) return;

    try {
      const res = await fetch("http://localhost:5001/timesheet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task,
          hours,
        }),
      });

      if (!res.ok) {
        console.log("Server error");
        return;
      }

      const data = await res.json();

      setList([...list, { task, hours }]);
      setTask("");
      setHours(0);

      console.log(data.message);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Timesheet Dashboard</h2>

      <input
        placeholder="Task"
        value={task}
        onChange={(e) => setTask(e.target.value)}
      />

      <input
        type="number"
        placeholder="Hours"
        value={hours}
        onChange={(e) => setHours(Number(e.target.value))}
      />

      <button onClick={addEntry}>Add</button>

      <hr />

      {list.map((item, index) => (
        <div key={index}>
          {item.task} - {item.hours} hrs
        </div>
      ))}
    </div>
  );
}

export default Dashboard;
