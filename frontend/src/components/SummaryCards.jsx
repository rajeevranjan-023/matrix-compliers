import React from "react";

const CLIMATE_TALK = {
  "cold-arid": "Cold climate", "cold-temperate": "Cold climate",
  "hot-dry": "Hot & dry climate", "hot-humid": "Hot & humid climate", composite: "Mixed climate",
};

function Pill({ tone = "muted", children }) {
  const tones = {
    sage: "bg-[#173028] text-sage border-sage/30",
    ember: "bg-[#3A2418] text-ember border-ember/30",
    muted: "bg-panel2 text-muted border-line",
  };
  return <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-medium border ${tones[tone]}`}>{children}</span>;
}

function DashCard({ title, baseline, optimized, tone, note }) {
  return (
    <div className="bg-panel border border-line rounded-xl p-4 flex-1 min-w-[160px]">
      <div className="text-muted text-[11px] uppercase tracking-wide mb-2.5">{title}</div>
      <div className="flex items-end gap-2.5">
        <div>
          <div className="text-ember/70 text-[10.5px] mb-0.5">Baseline</div>
          <div className="font-mono text-[17px] text-ember/90 line-through decoration-ember/40">{baseline}</div>
        </div>
        <span className="text-muted text-[13px] pb-1">→</span>
        <div>
          <div className="text-sage/80 text-[10.5px] mb-0.5">Optimized</div>
          <div className={`font-mono text-[22px] font-bold ${tone === "sage" ? "text-sage" : "text-amber"}`}>{optimized}</div>
        </div>
      </div>
      {note && <div className="text-muted text-[11px] mt-2 leading-snug">{note}</div>}
    </div>
  );
}

export default function SummaryCards({ data }) {
  if (!data) return null;
  const { classification, comparison, comfortScore, baselineScore, simulation, sustainability, inputs } = data;
  const bm = simulation.baselineMetrics, om = simulation.optimizedMetrics;
  const gainWord = comparison.isCold ? "warmer at night" : "cooler in peak heat";

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Pill tone="muted">{CLIMATE_TALK[classification.key] || classification.label}</Pill>
        {inputs.special?.snow && <Pill tone="muted">❄️ Snow conditions</Pill>}
        {inputs.special?.heatwave && <Pill tone="ember">🔥 Heatwave conditions</Pill>}
        {inputs.special?.wind && <Pill tone="muted">💨 High wind</Pill>}
        <span className="text-muted text-[12px]">
          Your optimized design is <b className="text-sage">{Math.abs(comparison.headlineGain)}°C {gainWord}</b> than a typical build for this spot.
        </span>
      </div>
      <div className="flex flex-wrap gap-3">
        <DashCard
          title="Night temperature"
          baseline={`${bm.min.toFixed(1)}°C`}
          optimized={`${om.min.toFixed(1)}°C`}
          tone="sage"
          note="Optimized stays warmer once the sun goes down."
        />
        <DashCard
          title="Heat retention"
          baseline={`${Math.round(bm.retention)}%`}
          optimized={`${Math.round(om.retention)}%`}
          tone="sage"
          note="Share of the day's heat still inside at night."
        />
        <DashCard
          title="Energy use"
          baseline="100%"
          optimized={`${100 - comparison.energySavingPercent}%`}
          tone="sage"
          note={`About ${comparison.energySavingPercent}% less heating/cooling needed.`}
        />
        <DashCard
          title="Comfort score"
          baseline={`${baselineScore.overall}/100`}
          optimized={`${comfortScore.overall}/100`}
          tone="sage"
          note={sustainability?.co2SavedKg ? `${sustainability.co2SavedKg} kg CO₂ avoided per day.` : "How well the design fits this climate."}
        />
      </div>
    </div>
  );
}
