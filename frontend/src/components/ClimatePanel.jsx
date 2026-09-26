import React from "react";
import { Card, StatCard, Badge } from "./Card";

function badgeTone(key) {
  if (key.startsWith("cold")) return "cold";
  if (key === "hot-dry") return "hot";
  if (key === "hot-humid") return "humid";
  return "mix";
}

export default function ClimatePanel({ data }) {
  const { location, classification, geometry } = data;
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard label="Location" value={location.name} sub={`Alt ${location.alt} m · ${geometry.floorArea} m² floor`} />
      <Card>
        <h3 className="text-muted text-[13px] font-medium mb-1.5">Climate class</h3>
        <Badge tone={badgeTone(classification.key)}>{classification.label}</Badge>
        <div className="text-muted text-xs mt-2">{classification.note}</div>
      </Card>
      <StatCard
        label="Temperature range"
        value={`${location.winterAvg}°–${location.summerAvg}°C`}
        sub={`Diurnal swing ${location.diurnal}°C · RH ${location.humidity}%`}
      />
      <StatCard
        label="Solar / wind"
        value={`${location.solar} kWh/m²`}
        sub={`per day · ${location.wind} km/h avg wind · ${location.source}`}
      />
    </div>
  );
}
