import React from "react";

export default function MinimalMetrics({ data }) {
  const sustainability = data?.sustainability || {};
  const om = data?.simulation?.optimizedMetrics || {};

  const rows = [
    ["Coldest it gets inside", om?.min != null ? `${om.min.toFixed(1)}°C` : "--"],
    ["Warmest it gets inside", om?.max != null ? `${om.max.toFixed(1)}°C` : "--"],
    ["Day to night change", om?.swingIn != null ? `${om.swingIn.toFixed(1)}°C` : "--"],
    ["Heat kept overnight", om?.retention != null ? `${Math.round(om.retention)}%` : "--"],
    ["Energy saved per day", sustainability?.savedKWh != null ? `${sustainability.savedKWh} kWh` : "--"],
  ];

  return (
    <div>
      {rows.map(([label, val]) => (
        <div key={label} className="flex justify-between items-baseline border-b border-line py-2.5 last:border-none">
          <span className="text-muted text-[13px]">{label}</span>
          <span className="text-[15px] font-semibold tabular-nums">{val}</span>
        </div>
      ))}
    </div>
  );
}
