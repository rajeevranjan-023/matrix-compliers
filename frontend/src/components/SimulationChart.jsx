import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { Card, StatCard } from "./Card";

/** Section 3: hourly indoor-vs-outdoor temperature simulation. */
export default function SimulationChart({ data }) {
  const { simulation, inputs, geometry } = data;
  const chartData = simulation.hours.map((h) => ({
    hour: `${h}:00`,
    Outdoor: simulation.outdoor[h],
    "Baseline indoor": simulation.baselineIndoor[h],
    "Optimized indoor": simulation.optimizedIndoor[h],
  }));
  const m = simulation.optimizedMetrics;

  return (
    <div>
      <h2 className="font-display text-xl font-semibold mb-1">Indoor vs outdoor temperature over 24 hours</h2>
      <p className="text-muted text-sm mb-5">
        Heat-balance model scaled to your {geometry.width}m × {geometry.length}m footprint. The green line marks your desired
        indoor temperature ({inputs.desiredTemp}°C).
      </p>

      <Card>
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={chartData}>
            <CartesianGrid stroke="#1a2738" />
            <XAxis dataKey="hour" tick={{ fill: "#8FA0B5", fontSize: 12 }} interval={2} />
            <YAxis tick={{ fill: "#8FA0B5", fontSize: 12 }} unit="°" />
            <Tooltip contentStyle={{ background: "#101C2C", border: "1px solid #22334A", fontSize: 13 }} />
            <Legend wrapperStyle={{ fontSize: 13, color: "#8FA0B5" }} />
            <ReferenceLine y={inputs.desiredTemp} stroke="#79A88E" strokeDasharray="2 3" />
            <Line type="monotone" dataKey="Outdoor" stroke="#6FA8C9" strokeDasharray="4 3" dot={false} />
            <Line type="monotone" dataKey="Baseline indoor" stroke="#D46A3E" dot={false} />
            <Line type="monotone" dataKey="Optimized indoor" stroke="#E8934A" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <StatCard label="Night minimum (optimized)" value={`${m.min.toFixed(1)}°C`} sub={`vs outdoor low of ${m.outMin.toFixed(1)}°C`} />
        <StatCard label="Indoor day–night swing" value={`${m.swingIn.toFixed(1)}°C`} sub={`outdoor swing is ${m.swingOut.toFixed(1)}°C`} />
        <StatCard label="Heat retention efficiency" value={`${Math.round(m.retention)}%`} sub="share of the outdoor swing kept out of the room" />
      </div>

      <p className="text-muted text-xs mt-3 leading-relaxed">
        Simplified physics (single thermal node, sinusoidal outdoor/solar profiles) intended for comparative
        design decisions, not certified energy compliance.
      </p>
    </div>
  );
}
