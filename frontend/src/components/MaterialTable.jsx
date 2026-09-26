import React from "react";
import { Card, StatCard } from "./Card";

function effPill(eff) {
  const tone = eff >= 80 ? "bg-[#3A5148] text-sage" : eff >= 65 ? "bg-[#2B2618] text-amber" : "bg-[#3A2418] text-ember";
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${tone}`}>{eff}/100</span>;
}

export default function MaterialTable({ data }) {
  const { materials, classification, inputs, geometry } = data;

  return (
    <div>
      <h2 className="font-display text-xl font-semibold mb-1">Recommended materials for {classification.label}</h2>
      <p className="text-muted text-sm mb-5">
        Costs scaled to your {geometry.width}m × {geometry.length}m footprint and {inputs.budget} budget tier.
      </p>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-[640px]">
          <thead>
            <tr className="text-muted text-xs text-left border-b border-line">
              <th className="py-2 pr-3 font-medium">Material</th>
              <th className="py-2 pr-3 font-medium">Applied to</th>
              <th className="py-2 pr-3 font-medium">U-value (W/m²K)</th>
              <th className="py-2 pr-3 font-medium">Cost (₹/m²)</th>
              <th className="py-2 pr-3 font-medium">Local availability</th>
              <th className="py-2 pr-3 font-medium">Efficiency</th>
            </tr>
          </thead>
          <tbody>
            {materials.materials.map((m) => (
              <tr key={m.name + m.use} className="border-b border-[#1a2738] last:border-none">
                <td className="py-2.5 pr-3">{m.name}</td>
                <td className="py-2.5 pr-3">{m.use}</td>
                <td className="py-2.5 pr-3 font-mono">{m.uValue ?? "—"}</td>
                <td className="py-2.5 pr-3 font-mono">₹{m.cost.toLocaleString("en-IN")}</td>
                <td className="py-2.5 pr-3">{m.avail}</td>
                <td className="py-2.5 pr-3">{effPill(m.efficiency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <StatCard
          label="Estimated envelope cost"
          value={`₹${materials.estimatedEnvelopeCost.toLocaleString("en-IN")}`}
          sub={`${geometry.floorArea} m² floor area, ${inputs.budget} budget tier`}
        />
        <StatCard label="Avg. material efficiency" value={`${materials.avgEfficiency}/100`} sub="weighted across wall, window, roof" />
        <StatCard
          label="Local sourcing"
          value={`${materials.materials.filter((m) => m.avail.startsWith("High")).length}/${materials.materials.length}`}
          sub="materials sourceable within-region"
        />
      </div>
    </div>
  );
}
