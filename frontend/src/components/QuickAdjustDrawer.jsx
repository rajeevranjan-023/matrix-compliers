import React, { useEffect, useState } from "react";

function Seg({ value, onChange, options }) {
  return (
    <div className="flex bg-panel2 border border-line rounded-lg p-[3px] gap-[3px]">
      {options.map((o) => (
        <button key={o.val} onClick={() => onChange(o.val)}
          className={`flex-1 px-1 py-1.5 rounded-md text-[11px] transition-colors ${value === o.val ? "bg-amber text-[#1A1206] font-semibold" : "text-muted hover:text-slate-200"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
function Row({ label, children }) {
  return (
    <div className="mb-3">
      <label className="block text-[11.5px] text-muted mb-[5px]">{label}</label>
      {children}
    </div>
  );
}


export default function QuickAdjustDrawer({ inputs, setInputs, onLiveChange, glazingOptions, ventilationOptions }) {
  const [open, setOpen] = useState(false);
  const set = (patch) => { setInputs((prev) => ({ ...prev, ...patch })); onLiveChange(); };

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-30">
      <button
        onClick={() => setOpen((o) => !o)}
        className="bg-amber text-[#1A1206] font-semibold text-[12px] rounded-l-lg px-2 py-3 shadow-lg"
        style={{ writingMode: "vertical-rl" }}
      >
        {open ? "Close ▸" : "◂ Quick adjust"}
      </button>
      {open && (
        <div className="absolute right-full top-1/2 -translate-y-1/2 w-[280px] max-h-[80vh] overflow-y-auto bg-panel border border-line rounded-l-xl rounded-r-none shadow-2xl p-4 mr-0">
          <h4 className="text-[12px] uppercase tracking-wide text-muted mb-3">Live 3D adjustments</h4>

          <Row label="Floors">
            <Seg value={inputs.floors} onChange={(v) => set({ floors: v })} options={[1, 2, 3].map((f) => ({ val: f, label: String(f) }))} />
          </Row>
          <Row label="Building area (sq ft)">
            <div className="flex items-center gap-2">
              <input type="range" min={80} max={2500} step={10} value={inputs.areaSqft}
                onChange={(e) => set({ areaSqft: Number(e.target.value) })} className="flex-1 accent-amber" />
              <span className="font-mono text-[12px] w-12 text-right">{inputs.areaSqft}</span>
            </div>
          </Row>
          <Row label="Roof type">
            <Seg value={inputs.roofType} onChange={(v) => set({ roofType: v })}
              options={["flat", "pitched", "vaulted"].map((r) => ({ val: r, label: r[0].toUpperCase() + r.slice(1) }))} />
          </Row>
          <Row label="Roof finish">
            <Seg value={inputs.roofFinish} onChange={(v) => set({ roofFinish: v })}
              options={[{ val: "standard", label: "Std" }, { val: "reflective", label: "Cool" }, { val: "green", label: "Green" }]} />
          </Row>
          <Row label="Orientation (azimuth °)">
            <div className="flex items-center gap-2">
              <input type="range" min={0} max={359} step={5} value={inputs.azimuthDeg}
                onChange={(e) => set({ orientationMode: "manual", azimuthDeg: Number(e.target.value) })} className="flex-1 accent-amber" />
              <span className="font-mono text-[12px] w-10 text-right">{inputs.azimuthDeg}°</span>
            </div>
          </Row>
          <Row label="Window-to-wall ratio">
            <div className="flex items-center gap-2">
              <input type="range" min={5} max={40} step={1} value={Math.round(inputs.windowWallRatio * 100)}
                onChange={(e) => set({ windowWallMode: "manual", windowWallRatio: Number(e.target.value) / 100 })} className="flex-1 accent-amber" />
              <span className="font-mono text-[12px] w-10 text-right">{Math.round(inputs.windowWallRatio * 100)}%</span>
            </div>
          </Row>
          <Row label="Wall thickness (mm)">
            <div className="flex items-center gap-2">
              <input type="range" min={100} max={600} step={10} value={inputs.wallThicknessMm}
                onChange={(e) => set({ wallInsulationMode: "manual", wallThicknessMm: Number(e.target.value) })} className="flex-1 accent-amber" />
              <span className="font-mono text-[12px] w-12 text-right">{inputs.wallThicknessMm}</span>
            </div>
          </Row>
          <Row label="Glazing">
            <select value={inputs.glazingType} onChange={(e) => set({ glazingMode: "manual", glazingType: e.target.value })}
              className="w-full bg-panel2 border border-line rounded-lg px-2 py-1.5 text-[12px]">
              {(glazingOptions || [{ id: "single", label: "Single" }, { id: "double", label: "Double" }, { id: "triple", label: "Triple" }]).map((g) => (
                <option key={g.id} value={g.id}>{g.label}</option>
              ))}
            </select>
          </Row>
          <Row label="Ventilation strategy">
            <select value={inputs.ventilationType} onChange={(e) => set({ ventilationMode: "manual", ventilationType: e.target.value })}
              className="w-full bg-panel2 border border-line rounded-lg px-2 py-1.5 text-[12px]">
              {(ventilationOptions || [{ id: "natural", label: "Natural" }, { id: "cross", label: "Cross-ventilation" }, { id: "hrv", label: "Mechanical (HRV)" }]).map((v) => (
                <option key={v.id} value={v.id}>{v.label}</option>
              ))}
            </select>
          </Row>
          <Row label="Balcony (2+ floors)">
            <Seg value={inputs.balcony} onChange={(v) => set({ balcony: v })}
              options={[{ val: "auto", label: "Auto" }, { val: "on", label: "On" }, { val: "off", label: "Off" }]} />
          </Row>
          <p className="text-muted text-[10.5px] leading-relaxed mt-1">Changes here re-run the simulation automatically after a short pause.</p>
        </div>
      )}
    </div>
  );
}
