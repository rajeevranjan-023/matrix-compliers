import React from "react";

export default function MinimalMetrics({ data }) {
  const comfortScore = data?.comfortScore || {};
  const sustainability = data?.sustainability || {};
  const om = data?.simulation?.optimizedMetrics || {};

  const rows = [
    ["Night min", om?.min != null ? `${om.min.toFixed(1)}°C` : "--"],
    ["Day max", om?.max != null ? `${om.max.toFixed(1)}°C` : "--"],
    ["Swing", om?.swingIn != null ? `${om.swingIn.toFixed(1)}°C` : "--"],
    ["Retention", om?.retention != null ? `${Math.round(om.retention)}%` : "--"],
    ["Insulation", comfortScore?.insulationScore != null ? `${comfortScore.insulationScore}/100` : "--"],
    ["Ventilation", comfortScore?.ventilationScore != null ? `${comfortScore.ventilationScore}/100` : "--"],
    ["Solar match", comfortScore?.solarScore != null ? `${comfortScore.solarScore}/100` : "--"],
    ["kWh saved/day", sustainability?.savedKWh ?? "--"],
  ];

  return (
    <div className="space-y-2.5">
      {rows.map(([label, val]) => (
        <div key={label} className="flex justify-between items-baseline border-b border-line pb-2">
          <span className="text-muted text-[12px]">{label}</span>
          <span className="font-mono text-[13.5px] font-semibold">{val}</span>
        </div>
      ))}
    </div>
  );
}