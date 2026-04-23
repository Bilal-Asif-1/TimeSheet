import { useState } from "react";

function Dashboard() {
  const [task, setTask] = useState("");
  const [hours, setHours] = useState<number>(0);
  const [list, setList] = useState<{ task: string; hours: number }[]>([]);

  const addEntry = () => {
    if (!task || hours <= 0) return;

    setList([...list, { task, hours }]);
    setTask("");
    setHours(0);
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
          <p>
            {item.task} - {item.hours} hrs
          </p>
        </div>
      ))}
    </div>
  );
}

export default Dashboard;
