import { useState } from "react";

const machinesData = [
  { id: 1, name: "CNC Machine 1", status: "Running", efficiency: 95 },
  { id: 2, name: "CNC Machine 2", status: "Running", efficiency: 90 },
  { id: 3, name: "Assembly Line 1", status: "Running", efficiency: 93 },
  { id: 4, name: "Packaging Unit", status: "Idle", efficiency: 70 },
  { id: 5, name: "Quality Check Unit", status: "Maintenance", efficiency: 0 },
];

export default function Machine() {
  const [machines] = useState(machinesData);

  return (
    <div style={{ padding: 20, fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <h2 style={{ marginBottom: 12 }}>Machines</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
        {machines.map((m) => (
          <div key={m.id} style={{ borderRadius: 12, padding: 14, border: "1px solid #e6eef8", background: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontWeight: 700 }}>{m.name}</div>
              <div style={{ fontSize: 12, padding: "4px 8px", borderRadius: 8, background: m.status === "Running" ? "#e6ffed" : m.status === "Idle" ? "#fff7e6" : "#ffe6e6", color: m.status === "Running" ? "#047857" : m.status === "Idle" ? "#92400e" : "#b91c1c" }}>{m.status}</div>
            </div>
            <div style={{ fontSize: 13, color: "#475569" }}>Efficiency</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <div style={{ width: 120, height: 10, background: "#f1f5f9", borderRadius: 6, overflow: "hidden" }}>
                <div style={{ width: `${m.efficiency}%`, height: "100%", background: m.efficiency > 80 ? "#22c55e" : m.efficiency > 50 ? "#eab308" : "#ef4444" }} />
              </div>
              <div style={{ fontWeight: 700 }}>{m.efficiency}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
