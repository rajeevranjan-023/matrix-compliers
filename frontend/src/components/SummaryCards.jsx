import React from "react";

const CLIMATE_TALK = {
  "cold-arid": "Cold and dry",
  "cold-cloudy": "Cold and cloudy",
  "hot-dry": "Hot and dry",
  "hot-humid": "Hot and humid",
  composite: "Changes with the seasons",
};

function Figure({ title, baseline, optimized, note, big = false, className = "" }) {
  return (
    <div className={`bg-panel border border-line rounded-xl ${className}`}>
      <div className="text-slate-300 text-[13px] mb-2">{title}</div>
      <div className="flex items-end gap-3">
        <div>
          <div className="text-muted text-[11px]">Normal building</div>
          <div className="text-[16px] text-muted tabular-nums">{baseline}</div>
        </div>
        <span className="text-muted pb-1">→</span>
        <div>
          <div className="text-sage text-[11px]">Yours</div>
          <div className={`font-semibold text-sage tabular-nums ${big ? "text-[30px] leading-none" : "text-[22px] leading-none"}`}>{optimized}</div>
        </div>
      </div>
      {note && <div className="text-muted text-[12px] mt-2.5 leading-snug">{note}</div>}
    </div>
  );
}

export default function SummaryCards({ data }) {
  if (!data) return null;
  const { classification, comparison, comfortScore, baselineScore, simulation, sustainability } = data;
  const bm = simulation.baselineMetrics, om = simulation.optimizedMetrics;
  const gainWord = comparison.isCold ? "warmer at night" : "cooler in the hottest hours";

  return (
    <div>
      <div className="mb-4">
        <div className="text-muted text-[12.5px] mb-1">{CLIMATE_TALK[classification.key] || classification.label} climate</div>
        <p className="text-[18px] m-0 leading-snug">
          Your design stays <b className="text-sage font-semibold">{Math.abs(comparison.headlineGain)}°C {gainWord}</b> than a normal building.
        </p>
      </div>
      <div className="flex flex-wrap gap-3 items-stretch">
        <Figure
          big
          className="flex-[1.4] min-w-[230px] px-5 py-4"
          title={comparison.isCold ? "Coldest point at night" : "Warmest point in the day"}
          baseline={`${bm.min.toFixed(1)}°C`}
          optimized={`${om.min.toFixed(1)}°C`}
          note="Once the sun goes down, yours holds its warmth better."
        />
        <Figure
          className="flex-1 min-w-[170px] px-4 py-3.5"
          title="Heat kept overnight"
          baseline={`${Math.round(bm.retention)}%`}
          optimized={`${Math.round(om.retention)}%`}
        />
        <Figure
          className="flex-1 min-w-[170px] p-4"
          title="Energy needed"
          baseline="100%"
          optimized={`${100 - comparison.energySavingPercent}%`}
          note={`About ${comparison.energySavingPercent}% less heating or cooling.`}
        />
        <Figure
          className="flex-1 min-w-[170px] px-4 py-3"
          title="Comfort score"
          baseline={`${baselineScore.overall}/100`}
          optimized={`${comfortScore.overall}/100`}
          note={sustainability?.co2SavedKg ? `Also saves ${sustainability.co2SavedKg} kg of CO₂ a day.` : undefined}
        />
      </div>
    </div>
  );
}
