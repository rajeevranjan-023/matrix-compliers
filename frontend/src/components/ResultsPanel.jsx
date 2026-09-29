
import React from "react";
import { Card, Badge, badgeTone } from "./Card";

export default function ResultsPanel({ data }) {
  if (!data) {
    return <p className="text-muted text-sm">Loading...</p>;
  }

  const {
    classification = {},
    location = {},
    score = {},
    comparison = {},
    sustainability = {},
    suggestions = [],
    heatwave = {},
    inputs = {},
    materials: mats = {},
  } = data;

  const gain = comparison?.headlineGain ?? 0;

  return (
    <div className="lg:sticky lg:top-3.5 lg:max-h-[calc(100vh-28px)] lg:overflow-y-auto">

      <Card className="mb-3">
        <h3 className="text-muted text-[11.5px] uppercase tracking-wide font-medium mb-2">
          Climate
        </h3>
        <Badge tone={badgeTone(classification?.key)}>
          {classification?.label || "N/A"}
        </Badge>
        <div className="text-muted text-[11.5px] mt-1.5">
          {location?.winterAvg ?? "--"}°–{location?.summerAvg ?? "--"}°C ·{" "}
          {location?.solar ?? "--"} kWh/m²/day ·{" "}
          {location?.wind ?? "--"} km/h wind
        </div>
      </Card>

      <Card className="mb-3">
        <h3 className="text-muted text-[11.5px] uppercase tracking-wide font-medium mb-2">
          Comfort score
        </h3>
        <div className="text-[32px] font-mono font-bold">
          {score?.overall ?? 0}
          <span className="text-[13px] text-muted">/100</span>
        </div>
        <div className="text-muted text-[11.5px]">
          Insulation {score?.insulationScore ?? 0} · Ventilation{" "}
          {score?.ventilationScore ?? 0} · Solar {score?.solarScore ?? 0}
        </div>
      </Card>

      <Card className="mb-3">
        <div className="flex justify-between py-2 border-b border-line">
          <span className="text-muted text-[12px]">
            {comparison?.isCold ? "Night gain" : "Peak reduction"}
          </span>
          <span
            className={`font-mono text-[14px] font-semibold ${
              gain >= 0 ? "text-sage" : "text-ember"
            }`}
          >
            {gain >= 0 ? "+" : ""}
            {gain}°C
          </span>
        </div>

        <div className="flex justify-between py-2 border-b border-line">
          <span className="text-muted text-[12px]">Energy saved</span>
          <span className="font-mono text-[14px] font-semibold text-sage">
            {comparison?.energySavingPercent ?? 0}%
          </span>
        </div>

        <div className="flex justify-between py-2 border-b border-line">
          <span className="text-muted text-[12px]">CO₂ avoided/day*</span>
          <span className="font-mono text-[14px] font-semibold text-sage">
            {sustainability?.co2SavedKg ?? 0} kg
          </span>
        </div>

        <div className="flex justify-between py-2">
          <span className="text-muted text-[12px]">Envelope cost</span>
          <span className="font-mono text-[14px] font-semibold">
            ₹{mats?.estimatedEnvelopeCost
              ? mats.estimatedEnvelopeCost.toLocaleString("en-IN")
              : "0"}
          </span>
        </div>
      </Card>

      {suggestions?.length > 0 && (
        <Card className="mb-3">
          <h3 className="text-muted text-[11.5px] uppercase tracking-wide font-medium mb-2">
            Smart suggestions
          </h3>
          {suggestions.map((s, i) => (
            <div
              key={i}
              className="bg-panel2 border border-line rounded-lg px-2.5 py-2 mb-1.5 text-[12px]"
            >
              <b className="text-sage">
                +{s?.scoreGain ?? 0} pt comfort
              </b>
              {s?.retentionGain > 0
                ? ` · +${s.retentionGain}% retention`
                : ""}
              <br />
              {s?.label || ""}
            </div>
          ))}
        </Card>
      )}

      {inputs?.special?.heatwave && (
        <Card className="mb-3">
          <h3 className="text-muted text-[11.5px] font-medium mb-2">
            Heatwave stress-test
          </h3>

          <div className="flex justify-between py-1.5 border-b border-line">
            <span className="text-muted text-[12px]">
              Normal summer peak
            </span>
            <span className="font-mono text-[13px]">
              {heatwave?.normalPeak ?? "--"}°C
            </span>
          </div>

          <div className="flex justify-between py-1.5">
            <span className="text-muted text-[12px]">
              Under heatwave
            </span>
            <span className="font-mono text-[13px] text-ember">
              {heatwave?.stressedPeak ?? "--"}°C
            </span>
          </div>
        </Card>
      )}

      <p className="text-muted text-[10.5px] px-1">
        *CO₂ estimate is approximate.
      </p>
    </div>
  );
}