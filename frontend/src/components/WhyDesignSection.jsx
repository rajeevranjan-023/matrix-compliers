import React from "react";

const FIELDS = [
  { key: "orientation", title: "Orientation", icon: "" },
  { key: "wallThickness", title: "Wall construction", icon: "" },
  { key: "windowPlacement", title: "Window placement", icon: "" },
  { key: "roofDesign", title: "Roof design", icon: "" },
];

const COLD_EXTRAS = [
  { icon: "", title: "Trombe wall or sunspace", text: "A glass-fronted dark wall on the south side collects heat during the day and stores it for the evening." },
  { icon: "", title: "Double-door entry", text: "Two doors with a small space between them keep cold air from rushing in." },
  { icon: "", title: "Dark interior surfaces", text: "Dark floors and walls behind the glass soak up sunlight and hold on to the warmth." },
  { icon: "", title: "Insulated shutters", text: "Shutters close at sunset to trap the heat inside." },
];

const HOT_EXTRAS = [
  { icon: "", title: "Shading over openings", text: "Deep overhangs keep the hot sun off the glass and walls." },
  { icon: "", title: "Night airing", text: "Windows open after dark so the cool night air can flush the day's heat out." },
  { icon: "", title: "Light-coloured roof", text: "A pale roof bounces sunlight away instead of soaking it up." },
];

export default function WhyDesignSection({ data }) {
  const design = data?.design || {};
  const key = data?.classification?.key || "";
  const isCold = key.startsWith("cold");
  const isHot = key.startsWith("hot");
  const extras = isCold ? COLD_EXTRAS : isHot ? HOT_EXTRAS : [];

  return (
    <div className="bg-panel border border-line rounded-xl p-5">
      <h3 className="font-display text-[17px] font-semibold mb-1">Why this works</h3>
      <p className="text-muted text-[13px] mb-5">Here is how the building is put together, and why each choice helps.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FIELDS.map((f) => {
          const item = design[f.key];
          if (!item) return null;
          return (
            <div key={f.key} className="bg-panel2 border border-line rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[18px]">{f.icon}</span>
                <span className="font-display text-[14px] font-semibold text-amber">{f.title}</span>
              </div>
              <p className="text-[13.5px] text-slate-100 leading-relaxed m-0 mb-2">{item.value}</p>
              <p className="text-[13px] text-muted leading-relaxed m-0 pl-3 border-l-2 border-amber/60">{item.why}</p>
            </div>
          );
        })}
      </div>

      {extras.length > 0 && (
        <div className="mt-5">
          <div className="text-muted text-[11px] uppercase tracking-wide mb-3">Extra touches that help</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {extras.map((e) => (
              <div key={e.title} className="flex gap-3 bg-panel2 border border-line rounded-lg px-3.5 py-3">
                <span className="text-[18px] leading-none mt-0.5">{e.icon}</span>
                <div>
                  <div className="text-[13.5px] font-semibold text-slate-100 mb-0.5">{e.title}</div>
                  <div className="text-[12.5px] text-muted leading-relaxed">{e.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {design.features?.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {design.features.map((f) => (
            <span key={f} className="text-[12px] text-sage bg-[#173028] border border-sage/30 rounded-md px-2.5 py-1">{f}</span>
          ))}
        </div>
      )}

      {design.warnings?.map((w) => (
        <div key={w} className="mt-4 px-3 py-2.5 rounded-lg bg-[#3A2418] border border-[#5A3A24] text-[#F0B48C] text-[12.5px] leading-relaxed">
          <b>Heads up:</b> {w}
        </div>
      ))}
    </div>
  );
}
