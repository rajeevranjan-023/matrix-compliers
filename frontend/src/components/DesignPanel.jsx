import React from "react";
import { Card } from "./Card";

const LABELS = {
  orientation: "Orientation",
  wallThickness: "Wall construction",
  windowPlacement: "Window placement",
  roofDesign: "Roof design",
};

export default function DesignPanel({ data }) {
  const { design, inputs } = data;
  return (
    <Card>
      <h3 className="text-sm font-medium mb-3.5">
        Generated design recommendation{" "}
        <span className="text-muted font-normal">
          — {inputs.areaSqft} sq ft, {inputs.floors} floor{inputs.floors > 1 ? "s" : ""}, {inputs.budget} budget
        </span>
      </h3>

      <ul className="list-none m-0 p-0">
        {Object.keys(LABELS).map((field) => (
          <li key={field} className="py-3 border-b border-line last:border-none">
            <div className="text-muted text-[11px] uppercase tracking-wide mb-1">{LABELS[field]}</div>
            <div className="text-[14.5px] leading-relaxed mb-1.5">{design[field].value}</div>
            <div className="text-[12.5px] text-muted leading-relaxed pl-3.5 border-l-2 border-amber">
              <span className="text-amber font-semibold">Why:</span> {design[field].why}
            </div>
          </li>
        ))}
        <li className="py-3">
          <div className="text-muted text-[11px] uppercase tracking-wide mb-1">Additional features</div>
          <ul className="list-disc list-inside space-y-1 text-[14.5px]">
            {design.features.map((f) => <li key={f}>{f}</li>)}
          </ul>
        </li>
      </ul>

      {design.notes?.length > 0 && (
        <ul className="mt-3.5 pt-3.5 border-t border-dashed border-line list-none p-0">
          {design.notes.map((n) => (
            <li key={n} className="text-[12.5px] text-muted py-1">• {n}</li>
          ))}
        </ul>
      )}

      {design.warnings?.map((w) => (
        <div key={w} className="mt-3.5 px-3.5 py-3 rounded-lg bg-[#3A2418] border border-[#5A3A24] text-[#F0B48C] text-[12.5px] leading-relaxed">
          <b>Heads up:</b> {w}
        </div>
      ))}
    </Card>
  );
}
