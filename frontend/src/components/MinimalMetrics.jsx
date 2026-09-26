import React from "react";

export default function MinimalMetrics({ data }) {
  const simulation = data?.simulation || {};
  const score = data?.score || {};
  const sustainability = data?.sustainability || {};
  const suggestions = data?.suggestions || [];

  const om = simulation?.optimizedMetrics || {};

  const rows = [
    ["Night min", om?.min ? `${om.min.toFixed(1)}°C` : "--"],
    ["Day max", om?.max ? `${om.max.toFixed(1)}°C` : "--"],
    ["Swing", om?.swingIn ? `${om.swingIn.toFixed(1)}°C` : "--"],
    ["Retention", om?.retention ? `${Math.round(om.retention)}%` : "--"],
    ["Insulation", score?.insulationScore ? `${score.insulationScore}/100` : "--"],
    ["Ventilation", score?.ventilationScore ? `${score.ventilationScore}/100` : "--"],
    ["Solar match", score?.solarScore ? `${score.solarScore}/100` : "--"],
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

      {suggestions.length > 0 && (
        <div className="pt-2">
          <div className="text-muted text-[11px] uppercase tracking-wide mb-1.5">
            Suggestions
          </div>

          {suggestions.map((s, idx) => (
            <div key={idx} className="text-[11.5px] text-muted leading-snug mb-1.5">
              <b className="text-sage">+{s.scoreGain || 0}pt</b> — {s.label || "Improvement"}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}