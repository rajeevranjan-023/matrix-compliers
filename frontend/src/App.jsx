import React, { useEffect, useRef, useState } from "react";
import { fetchLocations, generateDesign } from "./lib/api";
import InputPanel from "./components/InputPanel";
import Building3D from "./components/Building3D";
import SummaryCards from "./components/SummaryCards";
import MinimalMetrics from "./components/MinimalMetrics";
import WhyDesignSection from "./components/WhyDesignSection";
import SmartSuggestions from "./components/SmartSuggestions";
import QuickAdjustDrawer from "./components/QuickAdjustDrawer";
import Tabs from "./components/Tabs";
import SimulationChart from "./components/SimulationChart";
import ComfortScore from "./components/ComfortScore";
import ComparisonPanel from "./components/ComparisonPanel";
import MaterialTable from "./components/MaterialTable";
import SustainabilityPanel from "./components/SustainabilityPanel";
import MultiLocationPanel from "./components/MultiLocationPanel";
import PdfReportButton from "./components/PdfReportButton";
import Modal from "./components/Modal";
import ErrorBoundary from "./components/ErrorBoundary";
import ThermalStoragePage from "./components/ThermalStoragePage";

const TABS = [
  { id: "simulation", label: "Thermal Simulation" },
  { id: "comfort", label: "Comfort Score" },
  { id: "comparison", label: "Design Comparison" },
  { id: "materials", label: "Materials & Cost" },
  { id: "sustainability", label: "Sustainability" },
];

const DEFAULT_INPUTS = {
  location: "Leh, Ladakh",
  widthM: 6, lengthM: 5, floors: 1, roomType: "residential",
  budget: "medium", optimizationLevel: 1.0,
  desiredTemp: 21,
  materialPref: "auto",
  roofType: "flat", roofMaterial: "concrete",
  wallThicknessMM: 300, insulationLevel: "basic", glassType: "double", ventilationType: "natural",
  persona: "urban",
  orientationMode: "auto", azimuthDeg: 180,
  windowWallMode: "auto", windowWallRatio: 0.18,
  special: { snow: true, wind: false, coastal: false, heatwave: false },
};

export default function App() {
  const [page, setPage] = useState("input"); // 'input' | 'output'
  const [locations, setLocations] = useState([]);
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [data, setData] = useState(null);
  const [compareLocation, setCompareLocation] = useState(null);
  const [compareData, setCompareData] = useState(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState("structure");
  const [tab, setTab] = useState("simulation");
  const [updating, setUpdating] = useState(false);
  const liveTimer = useRef(null);
  const inputsRef = useRef(inputs);
  useEffect(() => { inputsRef.current = inputs; }, [inputs]);

  function handleLiveChange() {
    setUpdating(true);
    clearTimeout(liveTimer.current);
    liveTimer.current = setTimeout(async () => {
      try {
        const result = await generateDesign(inputsRef.current);
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setUpdating(false);
      }
    }, 550);
  }

  useEffect(() => {
    fetchLocations()
      .then(setLocations)
      .catch(() => setLocations([{ name: "Leh, Ladakh", lat: 34.16, lon: 77.58, defaults: { snow: true, wind: false, coastal: false } }]));
  }, []);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const result = await generateDesign(inputs);
      setData(result);
      setPage("output");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCompare(name) {
    setCompareLocation(name);
    if (!name) { setCompareData(null); return; }
    const loc = locations.find((l) => l.name === name);
    const payload = { ...inputs, location: name, special: { ...inputs.special, ...(loc?.defaults ?? {}) } };
    try { setCompareData(await generateDesign(payload)); } catch { setCompareData(null); }
  }

  if (page === "thermal-storage") {
    return <ThermalStoragePage onBack={() => setPage(data ? "output" : "input")} />;
  }

  if (page === "input") {
    return (
      <div>
        <header className="border-b border-line px-5 py-3.5 flex items-center justify-between flex-wrap gap-2.5">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-amber shadow-[0_0_10px] shadow-amber" />
            <div>
              <h1 className="font-display text-[17px] font-semibold m-0">ShelterIQ</h1>
            </div>
          </div>

        </header>
        {error && (
          <div className="max-w-4xl mx-auto mt-4 rounded-lg border border-ember/40 bg-ember/10 text-ember text-sm px-4 py-3">{error}</div>
        )}

        <InputPanel inputs={inputs} setInputs={setInputs} locations={locations} onGenerate={handleGenerate} loading={loading} />
      </div>
    );
  }


  return (
    <div>
      <header className="border-b border-line px-5 py-3.5 flex items-center justify-between flex-wrap gap-2.5">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-amber shadow-[0_0_10px] shadow-amber" />
          <div>
            <h1 className="font-display text-[17px] font-semibold m-0">ShelterIQ</h1>
            <div className="text-muted text-[12px]">{data.location.name} · {inputs.widthM}m × {inputs.lengthM}m, {inputs.floors} floor{inputs.floors > 1 ? "s" : ""}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPage("thermal-storage")} className="bg-amber text-[#1A1206] font-semibold rounded-lg px-3 py-2 text-[12px] hover:brightness-110">IMPORTANT :_ ☀️ Solar Heat Storage</button>
          <button onClick={() => setCompareOpen(true)} className="bg-panel2 border border-line text-slate-100 rounded-lg px-3 py-2 text-[12px] hover:border-amber">Compare cities</button>
          <PdfReportButton data={data} />
          <button onClick={() => setPage("input")} className="bg-panel2 border border-line text-slate-100 rounded-lg px-3 py-2 text-[12px] hover:border-amber">← Edit inputs</button>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto p-4 space-y-4">
        <SummaryCards data={data} />

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="lg:flex-[7] flex flex-col gap-3">
            <div className="flex bg-panel2 border border-line rounded-lg p-[3px] gap-[3px] w-fit">
              {["structure", "thermal", "airflow"].map((v) => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-3.5 py-1.5 rounded-md text-[12px] ${view === v ? "bg-glacier text-ink font-semibold" : "text-muted"}`}>
                  {v === "structure" ? "Structure" : v === "thermal" ? "Thermal (heat map)" : "Airflow"}
                </button>
              ))}
            </div>
            <div className="h-[640px]"><ErrorBoundary resetKey={data}><Building3D data={data} view={view} /></ErrorBoundary></div>
          </div>
          <div className="lg:flex-[3] bg-panel border border-line rounded-xl p-4">
            <h3 className="text-muted text-[11px] uppercase tracking-wide font-medium mb-3">Key metrics</h3>
            <ErrorBoundary resetKey={data}><MinimalMetrics data={data} /></ErrorBoundary>
          </div>
        </div>

        <ErrorBoundary resetKey={data}><WhyDesignSection data={data} /></ErrorBoundary>
        <ErrorBoundary resetKey={data}><SmartSuggestions data={data} /></ErrorBoundary>

        <div>
          <Tabs tabs={TABS} active={tab} onChange={setTab} />
          <div className="pt-5">
            <ErrorBoundary resetKey={`${tab}-${data ? 1 : 0}`}>
              {tab === "simulation" && <SimulationChart data={data} />}
              {tab === "comfort" && <ComfortScore data={data} />}
              {tab === "comparison" && <ComparisonPanel data={data} />}
              {tab === "materials" && <MaterialTable data={data} />}
              {tab === "sustainability" && <SustainabilityPanel data={data} />}
            </ErrorBoundary>
          </div>
        </div>
      </div>

      <Modal open={compareOpen} onClose={() => setCompareOpen(false)} title="Multi-location compare">
        <select
          value={compareLocation || ""}
          onChange={(e) => handleCompare(e.target.value || null)}
          className="w-full bg-panel2 border border-line rounded-lg px-3 py-2.5 text-[13.5px] mb-4"
        >
          <option value="">— choose a second location —</option>
          {locations.filter((l) => l.name !== inputs.location).map((l) => <option key={l.name} value={l.name}>{l.name}</option>)}
        </select>
        <MultiLocationPanel data={data} compareData={compareData} />
      </Modal>

      <QuickAdjustDrawer inputs={inputs} setInputs={setInputs} onLiveChange={handleLiveChange} updating={updating} />
    </div>
  );
}
