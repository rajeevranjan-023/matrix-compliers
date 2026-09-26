import React, { useState } from "react";

const LABELS = {
  orientation: "Orientation", wallThickness: "Wall construction",
  windowPlacement: "Window placement", roofDesign: "Roof design",
};


export default function WhyDesignSection({ data }) {
  const [open, setOpen] = useState(false);
  const { design } = data;
  return (
    <div className="bg-panel border border-line rounded-xl p-4">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between text-left">
        <h3 className="font-display text-[15px] font-semibold">Why this design?</h3>
        <span className="text-muted text-sm">{open ? "▴ hide" : "▾ show"}</span>
      </button>
      {open && (
        <div className="mt-4">
          <ul className="list-none m-0 p-0">
            {Object.keys(LABELS).map((field) => (
              <li key={field} className="py-3 border-b border-line last:border-none">
                <div className="text-muted text-[11px] uppercase tracking-wide mb-1">{LABELS[field]}</div>
                <div className="text-[14px] leading-relaxed mb-1.5">{design[field].value}</div>
                <div className="text-[12.5px] text-muted leading-relaxed pl-3.5 border-l-2 border-amber">
                  <span className="text-amber font-semibold">Why:</span> {design[field].why}
                </div>
              </li>
            ))}
            <li className="py-3">
              <div className="text-muted text-[11px] uppercase tracking-wide mb-1">Additional features</div>
              <ul className="list-disc list-inside space-y-1 text-[14px]">
                {design.features.map((f) => <li key={f}>{f}</li>)}
              </ul>
            </li>
          </ul>
          {design.notes?.length > 0 && (
            <ul className="mt-2 pt-3 border-t border-dashed border-line list-none p-0">
              {design.notes.map((n) => <li key={n} className="text-[12px] text-muted py-1">• {n}</li>)}
            </ul>
          )}
          {design.warnings?.map((w) => (
            <div key={w} className="mt-3 px-3 py-2.5 rounded-lg bg-[#3A2418] border border-[#5A3A24] text-[#F0B48C] text-[12px] leading-relaxed">
              <b>Heads up:</b> {w}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
