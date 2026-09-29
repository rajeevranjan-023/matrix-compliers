import React from "react";
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { Card } from "./Card";

export default function ComfortScore({ data }) {
  const s = data.comfortScore;
  const gaugeData = [{ name: "score", value: s.overall, fill: "#E8934A" }];

  return (
    <div>
      <h2 className="text-[20px] font-semibold mb-1">How comfortable will it feel?</h2>
      <p className="text-muted text-[13.5px] mb-5 mt-0 max-w-2xl">
        Three things go into this score: insulation, ventilation and how well the building uses the sun. Which one matters most depends on the climate.
      </p>

      <div className="flex flex-col md:flex-row gap-4">
        <Card className="md:w-[48%] flex items-center gap-6">
          <RadialBarChart
            width={150}
            height={150}
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
            <div className="text-[38px] font-semibold leading-none tabular-nums">
              {s.overall}
              <span className="text-base text-muted font-normal">/100</span>
            </div>
            <div className="text-muted text-[13.5px] mt-2">
              {s.overall >= 80 ? "Very good for this climate" : s.overall >= 60 ? "Good, but you can still improve it" : "Needs some changes"}
            </div>
          </div>
        </Card>

        <Card className="flex-1 px-5 py-4">
          {[
            ["Insulation", s.insulationScore],
            ["Ventilation", s.ventilationScore],
            ["Use of sunlight", s.solarScore],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between items-baseline py-2.5 border-b border-line last:border-none">
              <span className="text-muted text-[14px]">{label}</span>
              <span className="text-[16px] font-semibold tabular-nums">{val}/100</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
