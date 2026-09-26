import React from "react";
import { Card, StatCard } from "./Card";

export default function SustainabilityPanel({ data }) {
  const { sustainability } = data;
  return (
    <div>
      <h2 className="font-display text-xl font-semibold mb-1">Sustainability &amp; energy impact</h2>
      <p className="text-muted text-sm mb-5">
        Derived directly from the simulated heat-loss rate × degree-hours, not from an arbitrary scale.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Baseline load / day" value={`${sustainability.baseKWh} kWh`} />
        <StatCard label="Optimized load / day" value={`${sustainability.optKWh} kWh`} />
        <Card><h3 className="text-muted text-[13px] font-medium mb-1.5">Saved / day</h3><div className="text-[26px] font-mono font-bold text-sage">{sustainability.savedKWh} kWh</div></Card>
        <Card><h3 className="text-muted text-[13px] font-medium mb-1.5">CO₂ avoided / day</h3><div className="text-[26px] font-mono font-bold text-sage">{sustainability.co2SavedKg} kg</div></Card>
      </div>
      <p className="text-muted text-xs mt-3 leading-relaxed">
        CO₂ conversion assumes {sustainability.co2Factor} kg CO₂/kWh (approximate India grid average) — a stated
        assumption, not a measured figure. This is a per-simulated-day estimate, not an annualised audit number.
      </p>
    </div>
  );
}
