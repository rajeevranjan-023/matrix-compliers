import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { Card } from "./Card";

export default function SimulationChart({ data }) {
  const { simulation, inputs } = data;
  const chartData = simulation.hours.map((h) => ({
    hour: `${h}:00`,
    Outdoor: simulation.outdoor[h],
    "Normal building": simulation.baselineIndoor[h],
    "Your design": simulation.optimizedIndoor[h],
  }));
  const m = simulation.optimizedMetrics;

  return (
    <div>
      <h2 className="text-[20px] font-semibold mb-1">How the room temperature changes over a day</h2>
      <p className="text-muted text-[13.5px] mb-5 mt-0">
        The green dashed line is the {inputs.desiredTemp}°C you asked for. The closer the orange line stays to it, the better.
      </p>

      <Card className="pt-4 pb-2">
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={chartData}>
            <CartesianGrid stroke="#1a2738" />
            <XAxis dataKey="hour" tick={{ fill: "#8FA0B5", fontSize: 12 }} interval={2} />
            <YAxis tick={{ fill: "#8FA0B5", fontSize: 12 }} unit="°" />
            <Tooltip contentStyle={{ background: "#101C2C", border: "1px solid #22334A", fontSize: 13 }} />
            <Legend wrapperStyle={{ fontSize: 13, color: "#8FA0B5" }} />
            <ReferenceLine y={inputs.desiredTemp} stroke="#79A88E" strokeDasharray="2 3" />
            <Line type="monotone" dataKey="Outdoor" stroke="#6FA8C9" strokeDasharray="4 3" dot={false} />
            <Line type="monotone" dataKey="Normal building" stroke="#D46A3E" dot={false} />
            <Line type="monotone" dataKey="Your design" stroke="#E8934A" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="flex flex-wrap gap-x-10 gap-y-4 mt-5 px-1">
        <div>
          <div className="text-[26px] font-semibold tabular-nums">{m.min.toFixed(1)}°C</div>
          <div className="text-muted text-[13px]">coldest point inside (outside it drops to {m.outMin.toFixed(1)}°C)</div>
        </div>
        <div>
          <div className="text-[20px] font-semibold tabular-nums">{m.swingIn.toFixed(1)}°C</div>
          <div className="text-muted text-[13px]">swing inside, vs {m.swingOut.toFixed(1)}°C outside</div>
        </div>
        <div>
          <div className="text-[20px] font-semibold tabular-nums">{Math.round(m.retention)}%</div>
          <div className="text-muted text-[13px]">of the heat stays in</div>
        </div>
      </div>

      <p className="text-muted text-[12px] mt-5 leading-relaxed max-w-2xl">
        This is a simple estimate, good for comparing designs. It isn't a certified energy report.
      </p>
    </div>
  );
}
