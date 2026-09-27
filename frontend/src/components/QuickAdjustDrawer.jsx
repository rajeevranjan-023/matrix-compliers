import React, { useState } from "react";

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

export default function QuickAdjustDrawer({ inputs, setInputs, onLiveChange, updating }) {
  const [open, setOpen] = useState(false);
  const set = (patch) => { setInputs((prev) => ({ ...prev, ...patch })); onLiveChange(); };
  const setSpecial = (key, val) => { setInputs((prev) => ({ ...prev, special: { ...prev.special, [key]: val } })); onLiveChange(); };

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
          <h4 className="text-[12px] uppercase tracking-wide text-muted mb-3 flex items-center justify-between">
            Live adjustments {updating && <span className="text-amber font-mono normal-case">updating…</span>}
          </h4>

          <Row label="Floors">
            <Seg value={inputs.floors} onChange={(v) => set({ floors: v })} options={[1, 2, 3, 4].map((f) => ({ val: f, label: String(f) }))} />
          </Row>
          <Row label="Width (m)">
            <div className="flex items-center gap-2">
              <input type="range" min={3} max={20} step={0.5} value={inputs.widthM}
                onChange={(e) => set({ widthM: Number(e.target.value) })} className="flex-1 accent-amber" />
              <span className="font-mono text-[12px] w-10 text-right">{inputs.widthM}</span>
            </div>
          </Row>
          <Row label="Length (m)">
            <div className="flex items-center gap-2">
              <input type="range" min={3} max={20} step={0.5} value={inputs.lengthM}
                onChange={(e) => set({ lengthM: Number(e.target.value) })} className="flex-1 accent-amber" />
              <span className="font-mono text-[12px] w-10 text-right">{inputs.lengthM}</span>
            </div>
          </Row>
          <Row label="Roof shape">
            <Seg value={inputs.roofType} onChange={(v) => set({ roofType: v })}
              options={["flat", "pitched", "vaulted"].map((r) => ({ val: r, label: r[0].toUpperCase() + r.slice(1) }))} />
          </Row>
          <Row label="Roof material">
            <Seg value={inputs.roofMaterial} onChange={(v) => set({ roofMaterial: v })}
              options={[{ val: "concrete", label: "Concrete" }, { val: "metal", label: "Metal" }, { val: "thatch", label: "Thatch" }, { val: "insulated", label: "Insulated" }]} />
          </Row>
          <Row label="Which way it faces">
            <div className="flex items-center gap-2">
              <input type="range" min={0} max={359} step={5} value={inputs.azimuthDeg}
                onChange={(e) => set({ orientationMode: "manual", azimuthDeg: Number(e.target.value) })} className="flex-1 accent-amber" />
              <span className="font-mono text-[12px] w-10 text-right">{inputs.azimuthDeg}°</span>
            </div>
          </Row>
          <Row label="Window size">
            <div className="flex items-center gap-2">
              <input type="range" min={5} max={40} step={1} value={Math.round(inputs.windowWallRatio * 100)}
                onChange={(e) => set({ windowWallMode: "manual", windowWallRatio: Number(e.target.value) / 100 })} className="flex-1 accent-amber" />
              <span className="font-mono text-[12px] w-10 text-right">{Math.round(inputs.windowWallRatio * 100)}%</span>
            </div>
          </Row>
          <Row label="Wall thickness (mm)">
            <div className="flex items-center gap-2">
              <input type="range" min={80} max={700} step={10} value={inputs.wallThicknessMM}
                onChange={(e) => set({ wallThicknessMM: Number(e.target.value) })} className="flex-1 accent-amber" />
              <span className="font-mono text-[12px] w-12 text-right">{inputs.wallThicknessMM}</span>
            </div>
          </Row>
          <Row label="Insulation">
            <Seg value={inputs.insulationLevel} onChange={(v) => set({ insulationLevel: v })}
              options={[{ val: "none", label: "None" }, { val: "basic", label: "Basic" }, { val: "high", label: "High" }]} />
          </Row>
          <Row label="Glass">
            <Seg value={inputs.glassType} onChange={(v) => set({ glassType: v })}
              options={[{ val: "single", label: "Single" }, { val: "double", label: "Double" }]} />
          </Row>
          <Row label="Ventilation">
            <Seg value={inputs.ventilationType} onChange={(v) => set({ ventilationType: v })}
              options={[{ val: "natural", label: "Natural" }, { val: "mechanical", label: "Mechanical" }, { val: "none", label: "None" }]} />
          </Row>
          <Row label="Wall material">
            <Seg value={inputs.materialPref} onChange={(v) => set({ materialPref: v })}
              options={[{ val: "auto", label: "Auto" }, { val: "brick", label: "Brick" }, { val: "stone", label: "Stone" }, { val: "wood", label: "Wood" }]} />
          </Row>
          <Row label="Tough conditions">
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setSpecial("snow", !inputs.special?.snow)}
                className={`px-2 py-1 rounded-md text-[11px] border ${inputs.special?.snow ? "border-glacier text-glacier bg-glacier/10" : "border-line text-muted"}`}>❄️ Snow</button>
              <button onClick={() => setSpecial("heatwave", !inputs.special?.heatwave)}
                className={`px-2 py-1 rounded-md text-[11px] border ${inputs.special?.heatwave ? "border-ember text-ember bg-ember/10" : "border-line text-muted"}`}>🔥 Heatwave</button>
              <button onClick={() => setSpecial("wind", !inputs.special?.wind)}
                className={`px-2 py-1 rounded-md text-[11px] border ${inputs.special?.wind ? "border-sage text-sage bg-sage/10" : "border-line text-muted"}`}>💨 Wind</button>
            </div>
          </Row>
          <p className="text-muted text-[10.5px] leading-relaxed mt-1">Every change here updates the 3D model and the graph a moment later.</p>
        </div>
      )}
    </div>
  );
}
