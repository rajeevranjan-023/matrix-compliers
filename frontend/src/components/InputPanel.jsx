import React, { useEffect, useRef } from "react";

function nearestLocation(locations, lat, lon) {
  let best = null, bestD = Infinity;
  for (const loc of locations) {
    const d = Math.hypot(loc.lat - lat, loc.lon - lon);
    if (d < bestD) { bestD = d; best = loc; }
  }
  return best;
}

function Segmented({ value, onChange, options }) {
  return (
    <div className="flex bg-panel2 border border-line rounded-lg p-[3px] gap-[3px]">
      {options.map((o) => (
        <button key={o.val} onClick={() => onChange(o.val)}
          className={`flex-1 px-2 py-2 rounded-md text-[12px] transition-colors ${
            value === o.val ? "bg-amber text-[#1A1206] font-semibold" : "text-muted hover:text-slate-200"
          }`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
function Field({ label, hint, children }) {
  return (
    <div className="mb-4">
      <label className="block text-[12.5px] text-muted mb-[6px]">{label}</label>
      {children}
      {hint && <div className="text-[11px] text-muted mt-1 leading-relaxed">{hint}</div>}
    </div>
  );
}
function SectionCard({ title, children }) {
  return (
    <div className="bg-panel border border-line rounded-xl p-5">
      <h3 className="font-display text-[15px] font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
}

const PERSONA_LABELS = {
  urban: "Urban housing", rural: "Rural housing", army: "Army / forward shelter",
  "disaster-relief": "Disaster relief (tent/temporary)",
};

function PickerMap({ locations, onPick }) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  useEffect(() => {
    let cancelled = false;
    function init() {
      if (cancelled || !ref.current || !window.L || mapRef.current) return;
      const map = window.L.map(ref.current, { zoomControl: false, attributionControl: false }).setView([22.5, 79], 4);
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
      locations.forEach((loc) => window.L.circleMarker([loc.lat, loc.lon], { radius: 4, color: "#E8934A" }).addTo(map));
      map.on("click", (e) => {
        const near = nearestLocation(locations, e.latlng.lat, e.latlng.lng);
        if (near) onPick(near.name);
      });
      mapRef.current = map;
    }
    if (window.L) { init(); return () => { cancelled = true; }; }
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css"; link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = init;
    document.body.appendChild(script);
    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, [locations, onPick]);
  return <div ref={ref} className="h-[180px] rounded-lg bg-panel2 mt-2" />;
}

export default function InputPanel({ inputs, setInputs, locations, onGenerate, loading }) {
  const set = (patch) => setInputs((prev) => ({ ...prev, ...patch }));
  const setSpecial = (patch) => setInputs((prev) => ({ ...prev, special: { ...prev.special, ...patch } }));

  function handleLocation(name) {
    const loc = locations.find((l) => l.name === name);
    set({ location: name, special: { ...inputs.special, ...(loc?.defaults ?? {}) } });
  }

  return (
    <div className="max-w-4xl mx-auto p-5">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold mb-1">Design your shelter</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SectionCard title="Location">
          <Field label="City / region">
            <select value={inputs.location} onChange={(e) => handleLocation(e.target.value)} className="w-full bg-panel2 border border-line rounded-lg px-3 py-2.5 text-[13.5px]">
              {locations.map((l) => <option key={l.name} value={l.name}>{l.name}</option>)}
            </select>
          </Field>
          <Field label="Or click the map to pick the nearest data point" hint="Snaps to the nearest of 16 dataset cities — not live reverse-geocoding.">
            <PickerMap locations={locations} onPick={handleLocation} />
          </Field>
        </SectionCard>

        <SectionCard title="Building parameters">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Width (m)">
              <input type="number" min={3} max={30} step={0.5} value={inputs.widthM}
                onChange={(e) => set({ widthM: Math.max(3, Number(e.target.value) || 6) })}
                className="w-full bg-panel2 border border-line rounded-lg px-3 py-2.5 text-[13.5px]" />
            </Field>
            <Field label="Length (m)">
              <input type="number" min={3} max={30} step={0.5} value={inputs.lengthM}
                onChange={(e) => set({ lengthM: Math.max(3, Number(e.target.value) || 5) })}
                className="w-full bg-panel2 border border-line rounded-lg px-3 py-2.5 text-[13.5px]" />
            </Field>
          </div>
          <Field label="Number of floors">
            <Segmented value={inputs.floors} onChange={(v) => set({ floors: v })} options={[1, 2, 3].map((f) => ({ val: f, label: String(f) }))} />
          </Field>
          <Field label="Room type">
            <select value={inputs.roomType} onChange={(e) => set({ roomType: e.target.value })} className="w-full bg-panel2 border border-line rounded-lg px-3 py-2.5 text-[13.5px]">
              <option value="residential">Residential</option>
              <option value="office">Office</option>
              <option value="shelter">Shelter</option>
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Roof type">
              <select value={inputs.roofType} onChange={(e) => set({ roofType: e.target.value })} className="w-full bg-panel2 border border-line rounded-lg px-3 py-2.5 text-[13.5px]">
                <option value="flat">Flat</option>
                <option value="pitched">Pitched</option>
                <option value="vaulted">Vaulted</option>
              </select>
            </Field>
            <Field label="Roof material">
              <select value={inputs.roofMaterial} onChange={(e) => set({ roofMaterial: e.target.value })} className="w-full bg-panel2 border border-line rounded-lg px-3 py-2.5 text-[13.5px]">
                <option value="concrete">Concrete</option>
                <option value="metal">Metal sheet</option>
                <option value="thatch">Thatch</option>
                <option value="insulated">Insulated panel</option>
              </select>
            </Field>
          </div>
          <Field label={`Window-to-wall ratio: ${Math.round(inputs.windowWallRatio * 100)}%`}>
            <Segmented value={inputs.windowWallMode} onChange={(v) => set({ windowWallMode: v })} options={[{ val: "auto", label: "Auto" }, { val: "manual", label: "Manual" }]} />
            {inputs.windowWallMode === "manual" && (
              <input type="range" min={5} max={40} step={1} value={Math.round(inputs.windowWallRatio * 100)}
                onChange={(e) => set({ windowWallRatio: Number(e.target.value) / 100 })} className="w-full accent-amber mt-2" />
            )}
          </Field>
        </SectionCard>

        <SectionCard title="Construction & preferences">
          <div className="grid grid-cols-2 gap-3">
            <Field label={`Wall thickness: ${inputs.wallThicknessMM} mm`}>
              <input type="range" min={80} max={700} step={10} value={inputs.wallThicknessMM}
                onChange={(e) => set({ wallThicknessMM: Number(e.target.value) })} className="w-full accent-amber" />
            </Field>
            <Field label="Insulation level">
              <select value={inputs.insulationLevel} onChange={(e) => set({ insulationLevel: e.target.value })} className="w-full bg-panel2 border border-line rounded-lg px-3 py-2.5 text-[13.5px]">
                <option value="none">None</option>
                <option value="basic">Basic</option>
                <option value="high">High</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Glass type">
              <Segmented value={inputs.glassType} onChange={(v) => set({ glassType: v })} options={[{ val: "single", label: "Single" }, { val: "double", label: "Double" }]} />
            </Field>
            <Field label="Ventilation">
              <select value={inputs.ventilationType} onChange={(e) => set({ ventilationType: e.target.value })} className="w-full bg-panel2 border border-line rounded-lg px-3 py-2.5 text-[13.5px]">
                <option value="natural">Natural</option>
                <option value="mechanical">Mechanical</option>
                <option value="none">None</option>
              </select>
            </Field>
          </div>
          <Field label="Material preference">
            <select value={inputs.materialPref} onChange={(e) => set({ materialPref: e.target.value })} className="w-full bg-panel2 border border-line rounded-lg px-3 py-2.5 text-[13.5px]">
              <option value="auto">Auto (climate-optimal)</option>
              <option value="brick">Brick</option>
              <option value="stone">Stone</option>
              <option value="wood">Wood</option>
            </select>
          </Field>
          <Field label="Budget">
            <Segmented value={inputs.budget} onChange={(v) => set({ budget: v })} options={["low", "medium", "high"].map((b) => ({ val: b, label: b[0].toUpperCase() + b.slice(1) }))} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={`Desired indoor temp: ${inputs.desiredTemp}°C`}>
              <input type="range" min={18} max={24} step={1} value={inputs.desiredTemp} onChange={(e) => set({ desiredTemp: Number(e.target.value) })} className="w-full accent-amber" />
            </Field>
            <Field label={`Cost vs efficiency: ${inputs.optimizationLevel.toFixed(2)}×`}>
              <input type="range" min={50} max={140} step={5} value={Math.round(inputs.optimizationLevel * 100)} onChange={(e) => set({ optimizationLevel: Number(e.target.value) / 100 })} className="w-full accent-amber" />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="Orientation & special conditions">
          <Field label="Orientation">
            <Segmented value={inputs.orientationMode} onChange={(v) => set({ orientationMode: v })} options={[{ val: "auto", label: "Auto-optimize" }, { val: "manual", label: "Manual" }]} />
            {inputs.orientationMode === "manual" && (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <input type="range" min={0} max={359} step={5} value={inputs.azimuthDeg} onChange={(e) => set({ azimuthDeg: Number(e.target.value) })} className="flex-1 accent-amber" />
                  <span className="font-mono text-[13px] w-11 text-right">{inputs.azimuthDeg}°</span>
                </div>
                <div className="text-[11px] text-muted mt-1">0°=N, 90°=E, 180°=S, 270°=W — rotates the 3D model and changes the real solar-gain number.</div>
              </div>
            )}
          </Field>
          <Field label="User persona">
            <select value={inputs.persona} onChange={(e) => set({ persona: e.target.value })} className="w-full bg-panel2 border border-line rounded-lg px-3 py-2.5 text-[13.5px]">
              {Object.keys(PERSONA_LABELS).map((p) => <option key={p} value={p}>{PERSONA_LABELS[p]}</option>)}
            </select>
          </Field>
          <Field label="Special / extreme conditions">
            <div className="flex flex-col gap-2">
              {[["snow", " Snow loading"], ["wind", " High wind exposure"], ["coastal", "Coastal / salt air"], ["heatwave", " Include heatwave stress-test"]].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-[13px]">
                  <input type="checkbox" checked={!!inputs.special[key]} onChange={(e) => setSpecial({ [key]: e.target.checked })} className="accent-amber w-[15px] h-[15px]" />
                  {label}
                </label>
              ))}
            </div>
          </Field>
        </SectionCard>
      </div>

      <button onClick={onGenerate} disabled={loading}
        className="w-full bg-amber text-[#1A1206] font-semibold rounded-lg py-3.5 text-[14.5px] hover:brightness-110 active:brightness-95 disabled:opacity-60 mt-5">
        {loading ? "Generating…" : "Generate Design →"}
      </button>
    </div>
  );
}
