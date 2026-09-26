import React from "react";
import { Card, StatCard, Badge, badgeTone } from "./Card";

export default function Overview({ data }) {
  const { location, classification, design } = data;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <StatCard label="Location" value={location.name} sub={`Lat ${location.lat}° · Altitude ${location.alt} m`} />
        <Card>
          <h3 className="text-muted text-[13px] font-medium mb-1.5">Climate class</h3>
          <Badge tone={badgeTone(classification.key)}>{classification.label}</Badge>
          <div className="text-muted text-xs mt-2">{classification.note}</div>
        </Card>
        <StatCard
          label="Winter / summer avg"
          value={`${location.winterAvg}° / ${location.summerAvg}°C`}
          sub={`Diurnal swing ${location.diurnal}°C · RH ${location.humidity}%`}
        />
        <StatCard label="Solar resource" value={`${location.solar} kWh/m²/day`} sub={location.source} />
      </div>

      <Card>
        <h3 className="text-sm font-medium mb-3">Generated design recommendation</h3>
        <dl>
          {[
            ["Orientation", design.orientation],
            ["Wall construction", design.wallThickness],
            ["Window placement", design.windowPlacement],
            ["Roof design", design.roofDesign],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-4 py-3 border-b border-line last:border-none">
              <dt className="w-36 shrink-0 text-muted text-xs pt-0.5">{k}</dt>
              <dd className="text-[14.5px] leading-relaxed">{v}</dd>
            </div>
          ))}
          <div className="flex gap-4 py-3">
            <dt className="w-36 shrink-0 text-muted text-xs pt-0.5">Additional features</dt>
            <dd className="text-[14.5px] leading-relaxed">
              <ul className="list-disc list-inside space-y-1">
                {design.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
