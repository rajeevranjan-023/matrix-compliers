import React from "react";

const FIELDS = [
  { key: "orientation", title: "Which way it faces" },
  { key: "wallThickness", title: "The walls" },
  { key: "windowPlacement", title: "Windows" },
  { key: "roofDesign", title: "The roof" },
];

const COLD_EXTRAS = [
  { title: "Trombe wall or sunspace", text: "A dark wall behind glass on the south side. It soaks up sun all day and gives the heat back in the evening." },
  { title: "Double-door entry", text: "Two doors with a small space between them, so cold air doesn't rush in." },
  { title: "Dark floors and walls", text: "Dark surfaces behind the glass hold on to the warmth." },
  { title: "Shutters", text: "Close them at sunset to trap the heat." },
];

const HOT_EXTRAS = [
  { title: "Shade over windows", text: "Deep overhangs keep the hot sun off the glass and walls." },
  { title: "Open up at night", text: "Let the cool night air in to push the day's heat out." },
  { title: "Light-coloured roof", text: "A pale roof bounces sunlight away instead of soaking it up." },
];

export default function WhyDesignSection({ data }) {
  const design = data?.design || {};
  const key = data?.classification?.key || "";
  const isCold = key.startsWith("cold");
  const isHot = key.startsWith("hot");
  const extras = isCold ? COLD_EXTRAS : isHot ? HOT_EXTRAS : [];

  return (
    <div className="bg-panel border border-line rounded-xl px-5 pt-5 pb-6">
      <h3 className="text-[18px] font-semibold mb-1">Why we chose this</h3>
      <p className="text-muted text-[13.5px] mb-5 mt-0">Each choice below is there for a reason.</p>

      <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-x-10 gap-y-5">
        <div className="space-y-5">
          {FIELDS.map((f) => {
            const item = design[f.key];
            if (!item) return null;
            return (
              <div key={f.key}>
                <div className="text-amber text-[13.5px] font-semibold mb-1">{f.title}</div>
                <p className="text-[14px] leading-relaxed m-0 mb-1.5">{item.value}</p>
                <p className="text-[13px] text-muted leading-relaxed m-0">{item.why}</p>
              </div>
            );
          })}
        </div>

        {extras.length > 0 && (
          <div className="md:border-l md:border-line md:pl-8">
            <div className="text-[13.5px] font-semibold mb-3">A few extras that help</div>
            <ul className="list-none m-0 p-0 space-y-3.5">
              {extras.map((e) => (
                <li key={e.title}>
                  <div className="text-[13.5px] mb-0.5">{e.title}</div>
                  <div className="text-[12.5px] text-muted leading-relaxed">{e.text}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {design.features?.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2 items-center">
          <span className="text-muted text-[12.5px] mr-1">Also included:</span>
          {design.features.map((f) => (
            <span key={f} className="text-[12.5px] text-sage bg-[#173028] rounded-md px-2.5 py-1">{f}</span>
          ))}
        </div>
      )}

      {design.warnings?.map((w) => (
        <div key={w} className="mt-4 px-3.5 py-2.5 rounded-lg bg-[#3A2418] border border-[#5A3A24] text-[#F0B48C] text-[13px] leading-relaxed">
          <b>Heads up:</b> {w}
        </div>
      ))}
    </div>
  );
}
