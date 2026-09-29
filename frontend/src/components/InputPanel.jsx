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
          className={`flex-1 px-2 py-2 rounded-md text-[12.5px] ${
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
      <label className="block text-[13px] text-slate-300 mb-[6px]">{label}</label>
      {children}
      {hint && <div className="text-[11.5px] text-muted mt-1.5 leading-relaxed">{hint}</div>}
    </div>
  );
}
function SectionCard({ title, note, className = "p-5", children }) {
  return (
    <div className={`bg-panel border border-line rounded-xl ${className}`}>
      <h3 className="text-[15px] font-semibold mb-1">{title}</h3>
      {note ? <p className="text-muted text-[12px] mb-4 mt-0">{note}</p> : <div className="mb-3" />}
      {children}
    </div>
  );
}

const selectCls = "w-full bg-panel2 border border-line rounded-lg px-3 py-2.5 text-[13.5px]";

const PERSONA_LABELS = {
  urban: "Urban housing", rural: "Rural housing", army: "Army shelter",
  "disaster-relief": "Disaster relief (temporary tent)",
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
    <div className="settle max-w-4xl mx-auto px-5 pt-8 pb-12">
      <div className="mb-7 max-w-xl">
        <h1 className="text-[26px] font-semibold mb-2">Tell us about your building</h1>
        <p className="text-muted text-[14.5px] leading-relaxed m-0">
          Pick a place and fill in a few details. We'll show you how to build it so it stays comfortable without much heating or cooling. You can change anything later.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-5 items-start">
        <div className="w-full md:w-[46%] flex flex-col gap-5">
          <SectionCard title="Where will it be?" note="Choose a city, or tap the map.">
            <Field label="City / region">
              <select value={inputs.location} onChange={(e) => handleLocation(e.target.value)} className={selectCls}>
                {locations.map((l) => <option key={l.name} value={l.name}>{l.name}</option>)}
              </select>
            </Field>
            <Field label="Or pick from the map" hint="It picks the closest of our 16 cities. It can't find exact addresses.">
              <PickerMap locations={locations} onPick={handleLocation} />
            </Field>
          </SectionCard>

          <SectionCard title="How big is it?" className="px-5 pt-4 pb-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Width (m)">
                <input type="number" min={3} max={30} step={0.5} value={inputs.widthM}
                  onChange={(e) => set({ widthM: Math.max(3, Number(e.target.value) || 6) })}
                  className={selectCls} />
              </Field>
              <Field label="Length (m)">
                <input type="number" min={3} max={30} step={0.5} value={inputs.lengthM}
                  onChange={(e) => set({ lengthM: Math.max(3, Number(e.target.value) || 5) })}
                  className={selectCls} />
              </Field>
            </div>
            <Field label="Floors">
              <Segmented value={inputs.floors} onChange={(v) => set({ floors: v })} options={[1, 2, 3].map((f) => ({ val: f, label: String(f) }))} />
            </Field>
            <Field label="What is it used for?">
              <select value={inputs.roomType} onChange={(e) => set({ roomType: e.target.value })} className={selectCls}>
                <option value="residential">Home</option>
                <option value="office">Office</option>
                <option value="shelter">Shelter</option>
              </select>
            </Field>
            <Field label="Who is it for?">
              <select value={inputs.persona} onChange={(e) => set({ persona: e.target.value })} className={selectCls}>
                {Object.keys(PERSONA_LABELS).map((p) => <option key={p} value={p}>{PERSONA_LABELS[p]}</option>)}
              </select>
            </Field>
          </SectionCard>

          <SectionCard title="Which way should it face?" className="p-4">
            <Field label="Direction">
              <Segmented value={inputs.orientationMode} onChange={(v) => set({ orientationMode: v })} options={[{ val: "auto", label: "Let us choose" }, { val: "manual", label: "I'll set it" }]} />
              {inputs.orientationMode === "manual" ? (
                <div className="mt-3">
                  <div className="flex items-center gap-2">
                    <input type="range" min={0} max={359} step={5} value={inputs.azimuthDeg} onChange={(e) => set({ azimuthDeg: Number(e.target.value) })} className="flex-1 accent-amber" />
                    <span className="text-[13px] w-11 text-right tabular-nums">{inputs.azimuthDeg}°</span>
                  </div>
                  <div className="text-[11.5px] text-muted mt-1">0° is north, 90° east, 180° south, 270° west.</div>
                </div>
              ) : (
                <div className="text-[11.5px] text-muted mt-1.5">Usually the best choice. We pick the direction that gets the most useful sun.</div>
              )}
            </Field>
          </SectionCard>
        </div>

        <div className="w-full md:w-[54%] flex flex-col gap-5">
          <SectionCard title="Walls and roof" note="This is what keeps the heat in (or out).">
            <div className="grid grid-cols-2 gap-3">
              <Field label={`Wall thickness: ${inputs.wallThicknessMM} mm`} hint="Thicker walls hold heat longer.">
                <input type="range" min={80} max={700} step={10} value={inputs.wallThicknessMM}
                  onChange={(e) => set({ wallThicknessMM: Number(e.target.value) })} className="w-full accent-amber" />
              </Field>
              <Field label="Insulation">
                <select value={inputs.insulationLevel} onChange={(e) => set({ insulationLevel: e.target.value })} className={selectCls}>
                  <option value="none">None</option>
                  <option value="basic">Basic</option>
                  <option value="high">High</option>
                </select>
              </Field>
            </div>
            <Field label="Wall material">
              <select value={inputs.materialPref} onChange={(e) => set({ materialPref: e.target.value })} className={selectCls}>
                <option value="auto">Not sure, suggest one</option>
                <option value="brick">Brick</option>
                <option value="stone">Stone</option>
                <option value="wood">Wood</option>
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Roof shape">
                <select value={inputs.roofType} onChange={(e) => set({ roofType: e.target.value })} className={selectCls}>
                  <option value="flat">Flat</option>
                  <option value="pitched">Sloped</option>
                  <option value="vaulted">Curved</option>
                </select>
              </Field>
              <Field label="Roof material">
                <select value={inputs.roofMaterial} onChange={(e) => set({ roofMaterial: e.target.value })} className={selectCls}>
                  <option value="concrete">Concrete</option>
                  <option value="metal">Metal sheet</option>
                  <option value="thatch">Thatch</option>
                  <option value="insulated">Insulated panel</option>
                </select>
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Windows and fresh air" className="px-5 pt-4 pb-2">
            <Field label={`Window size: ${Math.round(inputs.windowWallRatio * 100)}% of the wall`}>
              <Segmented value={inputs.windowWallMode} onChange={(v) => set({ windowWallMode: v })} options={[{ val: "auto", label: "Let us choose" }, { val: "manual", label: "I'll set it" }]} />
              {inputs.windowWallMode === "manual" && (
                <input type="range" min={5} max={40} step={1} value={Math.round(inputs.windowWallRatio * 100)}
                  onChange={(e) => set({ windowWallRatio: Number(e.target.value) / 100 })} className="w-full accent-amber mt-3" />
              )}
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Glass">
                <Segmented value={inputs.glassType} onChange={(v) => set({ glassType: v })} options={[{ val: "single", label: "Single" }, { val: "double", label: "Double" }]} />
              </Field>
              <Field label="Ventilation">
                <select value={inputs.ventilationType} onChange={(e) => set({ ventilationType: e.target.value })} className={selectCls}>
                  <option value="natural">Open windows</option>
                  <option value="mechanical">Fans / vents</option>
                  <option value="none">None</option>
                </select>
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Budget and comfort" className="p-5 pb-4">
            <Field label="Budget">
              <Segmented value={inputs.budget} onChange={(v) => set({ budget: v })} options={["low", "medium", "high"].map((b) => ({ val: b, label: b[0].toUpperCase() + b.slice(1) }))} />
            </Field>
            <Field label={`Room temperature you want: ${inputs.desiredTemp}°C`} hint="Around 20 to 22°C feels comfortable for most people.">
              <input type="range" min={18} max={24} step={1} value={inputs.desiredTemp} onChange={(e) => set({ desiredTemp: Number(e.target.value) })} className="w-full accent-amber" />
            </Field>
            <Field label="Save money or get the best result?">
              <input type="range" min={50} max={140} step={5} value={Math.round(inputs.optimizationLevel * 100)} onChange={(e) => set({ optimizationLevel: Number(e.target.value) / 100 })} className="w-full accent-amber" />
              <div className="flex justify-between text-[11.5px] text-muted mt-1">
                <span>Cheaper</span>
                <span>Performs better</span>
              </div>
            </Field>
          </SectionCard>

          <SectionCard title="Is the weather harsh there?" note="Tick whatever applies. We'll plan for it.">
            <div className="flex flex-col gap-2.5">
              {[["snow", "Heavy snow"], ["wind", "Strong winds"], ["coastal", "Near the sea (salty air)"], ["heatwave", "Test it against a heatwave"]].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-[13.5px]">
                  <input type="checkbox" checked={!!inputs.special[key]} onChange={(e) => setSpecial({ [key]: e.target.checked })} className="accent-amber w-[15px] h-[15px]" />
                  {label}
                </label>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="mt-7 flex items-center justify-end gap-4 flex-wrap">
        {loading && <span className="text-muted text-[12.5px]">The first try can take a few seconds while the server wakes up.</span>}
        <button onClick={onGenerate} disabled={loading}
          className="bg-amber text-[#1A1206] font-semibold rounded-lg px-7 py-3 text-[14.5px] hover:brightness-110 disabled:opacity-60">
          {loading ? "Working on it…" : "Show me the design →"}
        </button>
      </div>
    </div>
  );
}
