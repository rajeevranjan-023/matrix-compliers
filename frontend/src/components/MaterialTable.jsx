import React from "react";
import { Card } from "./Card";

function effPill(eff) {
  const tone = eff >= 80 ? "bg-[#3A5148] text-sage" : eff >= 65 ? "bg-[#2B2618] text-amber" : "bg-[#3A2418] text-ember";
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${tone}`}>{eff}/100</span>;
}

export default function MaterialTable({ data }) {
  const { materials, inputs, geometry } = data;
  const easyCount = materials.materials.filter((m) => m.avail.startsWith("High")).length;

  return (
    <div>
      <h2 className="text-[20px] font-semibold mb-1">What to build it with</h2>
      <p className="text-muted text-[13.5px] mb-5 mt-0">
        Prices are rough. They're based on your {geometry.width}m × {geometry.length}m plan and {inputs.budget} budget.
      </p>

      <Card className="overflow-x-auto px-5 pt-3 pb-2">
        <table className="w-full text-[13.5px] border-collapse min-w-[640px]">
          <thead>
            <tr className="text-muted text-[12px] text-left border-b border-line">
              <th className="py-2 pr-3 font-medium">Material</th>
              <th className="py-2 pr-3 font-medium">Used for</th>
              <th className="py-2 pr-3 font-medium">Heat loss (U-value)</th>
              <th className="py-2 pr-3 font-medium">Cost per m²</th>
              <th className="py-2 pr-3 font-medium">Easy to find?</th>
              <th className="py-2 pr-3 font-medium">Rating</th>
            </tr>
          </thead>
          <tbody>
            {materials.materials.map((m) => (
              <tr key={m.name + m.use} className="border-b border-[#1a2738] last:border-none">
                <td className="py-2.5 pr-3">{m.name}</td>
                <td className="py-2.5 pr-3 text-muted">{m.use}</td>
                <td className="py-2.5 pr-3 tabular-nums">{m.uValue ?? "—"}</td>
                <td className="py-2.5 pr-3 tabular-nums">₹{m.cost.toLocaleString("en-IN")}</td>
                <td className="py-2.5 pr-3 text-muted">{m.avail}</td>
                <td className="py-2.5 pr-3">{effPill(m.efficiency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="text-muted text-[12px] mt-2 mb-0 px-1">A lower heat loss number means better insulation.</p>

      <div className="flex flex-wrap items-end gap-x-10 gap-y-4 mt-6 px-1">
        <div>
          <div className="text-muted text-[13px] mb-0.5">Rough cost for the walls, roof and windows</div>
          <div className="text-[28px] font-semibold tabular-nums">₹{materials.estimatedEnvelopeCost.toLocaleString("en-IN")}</div>
          <div className="text-muted text-[12px]">for {geometry.floorArea} m² of floor</div>
        </div>
        <div>
          <div className="text-[20px] font-semibold tabular-nums">{materials.avgEfficiency}/100</div>
          <div className="text-muted text-[13px]">average rating</div>
        </div>
        <div>
          <div className="text-[20px] font-semibold tabular-nums">{easyCount} of {materials.materials.length}</div>
          <div className="text-muted text-[13px]">easy to get nearby</div>
        </div>
      </div>
    </div>
  );
}
