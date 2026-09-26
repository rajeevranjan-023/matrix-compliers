import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card } from "./Card";

const PERSONA_LABELS = {
  urban: "Urban housing", rural: "Rural housing", army: "Army / forward shelter",
  "disaster-relief": "Disaster relief (tent/temporary)",
};

export default function ComparisonPanel({ data }) {
  const { simulation, comparison, comfortScore, baselineScore, inputs } = data;
  const chartData = simulation.hours.map((h) => ({
    hour: `${h}:00`,
    "Baseline indoor": simulation.baselineIndoor[h],
    "Optimized indoor": simulation.optimizedIndoor[h],
  }));

  const gainLabel = comparison.isCold ? "Night-time indoor temperature gain" : "Daytime peak temperature reduction";
  const gain = comparison.headlineGain;
  const bm = simulation.baselineMetrics;
  const om = simulation.optimizedMetrics;

  const rows = [
    [gainLabel, `${gain >= 0 ? "+" : ""}${gain}°C`, gain >= 0 ? "text-sage" : "text-ember"],
    ["Baseline night minimum", `${bm.min.toFixed(1)}°C`, ""],
    ["Optimized night minimum", `${om.min.toFixed(1)}°C`, ""],
    ["Indoor swing (baseline → optimized)", `${bm.swingIn.toFixed(1)}° → ${om.swingIn.toFixed(1)}°`, "text-sage"],
    ["Heat retention (baseline → optimized)", `${Math.round(bm.retention)}% → ${Math.round(om.retention)}%`, "text-sage"],
    ["Estimated conditioning energy saved", `${comparison.energySavingPercent}%`, "text-sage"],
    ["Comfort score (baseline → optimized)", `${baselineScore.overall} → ${comfortScore.overall}`, "text-sage"],
  ];

  return (
    <div>
      <h2 className="font-display text-xl font-semibold mb-1">Baseline vs optimized design</h2>
      <p className="text-muted text-sm mb-5">
        Baseline reflects a typical existing structure for the selected persona (
        <b className="text-slate-300 font-normal">{PERSONA_LABELS[inputs.persona]}</b>) at the same floor area —
        optimized is this engine's recommendation for your inputs.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid stroke="#1a2738" />
              <XAxis dataKey="hour" tick={{ fill: "#8FA0B5", fontSize: 11 }} interval={3} />
              <YAxis tick={{ fill: "#8FA0B5", fontSize: 12 }} unit="°" />
              <Tooltip contentStyle={{ background: "#101C2C", border: "1px solid #22334A", fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#8FA0B5" }} />
              <Bar dataKey="Baseline indoor" fill="#D46A3E" />
              <Bar dataKey="Optimized indoor" fill="#E8934A" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          {rows.map(([label, val, tone]) => (
            <div key={label} className="flex justify-between items-baseline gap-3 py-3 border-b border-line last:border-none">
              <span className="text-muted text-[13.5px]">{label}</span>
              <span className={`font-mono text-[15px] font-semibold whitespace-nowrap ${tone}`}>{val}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
