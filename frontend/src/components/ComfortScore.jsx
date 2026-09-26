import React from "react";
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { Card } from "./Card";

export default function ComfortScore({ data }) {
  const s = data.comfortScore;
  const gaugeData = [{ name: "score", value: s.overall, fill: "#E8934A" }];

  return (
    <div>
      <h2 className="font-display text-xl font-semibold mb-1">Thermal comfort score</h2>
      <p className="text-muted text-sm mb-5">
        Weighted from insulation quality, ventilation match, and solar gain match — weights shift by climate
        (ventilation dominates in hot-humid; insulation dominates in cold-arid).
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="flex items-center gap-6">
          <RadialBarChart
            width={160}
            height={160}
            innerRadius="75%"
            outerRadius="100%"
            data={gaugeData}
            startAngle={225}
            endAngle={-45}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar background={{ fill: "#1a2738" }} dataKey="value" cornerRadius={8} />
          </RadialBarChart>
          <div>
            <div className="text-[40px] font-mono font-bold">
              {s.overall}
              <span className="text-base text-muted">/100</span>
            </div>
            <div className="text-muted text-sm">
              {s.overall >= 80 ? "Excellent match for this climate" : s.overall >= 60 ? "Good, with room to improve" : "Needs design revision"}
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-medium mb-3">Breakdown</h3>
          {[
            ["Insulation", s.insulationScore],
            ["Ventilation match", s.ventilationScore],
            ["Solar gain match", s.solarScore],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between items-baseline py-3 border-b border-line last:border-none">
              <span className="text-muted text-sm">{label}</span>
              <span className="font-mono text-base font-semibold">{val}/100</span>
            </div>
          ))}
          <ul className="mt-3 space-y-2">
            {s.suggestions.map((sug) => (
              <li key={sug} className="text-muted text-sm border-b border-dashed border-line pb-2 last:border-none">
                {sug}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
