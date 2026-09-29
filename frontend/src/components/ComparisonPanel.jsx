import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card } from "./Card";

const PERSONA_LABELS = {
  urban: "urban home", rural: "rural home", army: "army shelter",
  "disaster-relief": "temporary relief tent",
};

export default function ComparisonPanel({ data }) {
  const { simulation, comparison, comfortScore, baselineScore, inputs } = data;
  const chartData = simulation.hours.map((h) => ({
    hour: `${h}:00`,
    "Normal building": simulation.baselineIndoor[h],
    "Your design": simulation.optimizedIndoor[h],
  }));

  const gain = comparison.headlineGain;
  const bm = simulation.baselineMetrics;
  const om = simulation.optimizedMetrics;

  const rows = [
    [comparison.isCold ? "Warmer at night by" : "Cooler at peak heat by", `${gain >= 0 ? "+" : ""}${gain}°C`, gain >= 0 ? "text-sage" : "text-ember"],
    ["Coldest point", `${bm.min.toFixed(1)}° → ${om.min.toFixed(1)}°`, ""],
    ["Heat kept", `${Math.round(bm.retention)}% → ${Math.round(om.retention)}%`, ""],
    ["Energy saved", `${comparison.energySavingPercent}%`, "text-sage"],
    ["Comfort score", `${baselineScore.overall} → ${comfortScore.overall}`, ""],
  ];

  return (
    <div>
      <h2 className="text-[20px] font-semibold mb-1">Your design vs a normal building</h2>
      <p className="text-muted text-[13.5px] mb-5 mt-0 max-w-2xl">
        The "normal building" is a typical {PERSONA_LABELS[inputs.persona] || "building"} with the same floor area, built the usual way.
      </p>

      <div className="flex flex-col md:flex-row gap-4">
        <Card className="md:flex-[3] pt-4 pb-2">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid stroke="#1a2738" />
              <XAxis dataKey="hour" tick={{ fill: "#8FA0B5", fontSize: 11 }} interval={3} />
              <YAxis tick={{ fill: "#8FA0B5", fontSize: 12 }} unit="°" />
              <Tooltip contentStyle={{ background: "#101C2C", border: "1px solid #22334A", fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#8FA0B5" }} />
              <Bar dataKey="Normal building" fill="#D46A3E" />
              <Bar dataKey="Your design" fill="#E8934A" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="md:flex-[2] self-start px-5 py-3">
          {rows.map(([label, val, tone]) => (
            <div key={label} className="flex justify-between items-baseline gap-3 py-2.5 border-b border-line last:border-none">
              <span className="text-muted text-[13.5px]">{label}</span>
              <span className={`text-[15px] font-semibold whitespace-nowrap tabular-nums ${tone}`}>{val}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
