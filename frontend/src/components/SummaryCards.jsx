import React from "react";

export default function MinimalMetrics({ data }) {
  if (!data) {
    return (
      <div className="text-center text-muted py-4">
        Loading metrics...
      </div>
    );
  }

  const {
    insulationScore = 0,
    heatRetention = 0,
    efficiency = 0,
  } = data || {};

  const items = [
    {
      label: "Insulation",
      value: insulationScore !== undefined ? `${insulationScore}/100` : "—",
    },
    {
      label: "Heat retention",
      value: heatRetention !== undefined ? `${heatRetention}%` : "—",
    },
    {
      label: "Efficiency",
      value: efficiency !== undefined ? `${efficiency}%` : "—",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((it) => (
        <div
          key={it.label}
          className="bg-panel border border-line rounded-lg px-3 py-2"
        >
          <div className="text-muted text-xs mb-1">{it.label}</div>
          <div className="font-mono text-lg font-bold">
            {it.value}
          </div>
        </div>
      ))}
    </div>
  );
}