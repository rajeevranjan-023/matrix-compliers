import React from "react";
import { Card } from "./Card";

export default function MultiLocationPanel({ data, compareData }) {
  if (!compareData) {
    return <p className="text-muted text-[13px] m-0">Nothing to compare yet. Pick a city from the list above.</p>;
  }
  const s = data, c = compareData;
  const rows = [
    ["Climate", s.classification.label, c.classification.label],
    ["Coldest / warmest inside", `${s.simulation.optimizedMetrics.min.toFixed(1)}° / ${s.simulation.optimizedMetrics.max.toFixed(1)}°`, `${c.simulation.optimizedMetrics.min.toFixed(1)}° / ${c.simulation.optimizedMetrics.max.toFixed(1)}°`],
    ["Comfort score", s.comfortScore.overall, c.comfortScore.overall],
    ["Energy saved", `${s.comparison.energySavingPercent}%`, `${c.comparison.energySavingPercent}%`],
    ["CO₂ avoided per day", `${s.sustainability.co2SavedKg} kg`, `${c.sustainability.co2SavedKg} kg`],
    ["Rough building cost", `₹${s.materials.estimatedEnvelopeCost.toLocaleString("en-IN")}`, `₹${c.materials.estimatedEnvelopeCost.toLocaleString("en-IN")}`],
  ];
  return (
    <div className="settle">
      <h2 className="text-[16px] font-semibold mb-3">{s.location.name} vs {c.location.name}</h2>
      <Card className="px-4 py-2">
        <table className="w-full text-[13.5px] border-collapse">
          <thead>
            <tr className="text-muted text-[12px] text-left border-b border-line">
              <th className="py-2 pr-3 font-medium"></th>
              <th className="py-2 pr-3 font-medium">{s.location.name}</th>
              <th className="py-2 pr-3 font-medium">{c.location.name}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r[0]} className="border-b border-[#1a2738] last:border-none">
                <td className="py-2.5 pr-3 text-muted">{r[0]}</td>
                <td className="py-2.5 pr-3 tabular-nums">{r[1]}</td>
                <td className="py-2.5 pr-3 tabular-nums">{r[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
