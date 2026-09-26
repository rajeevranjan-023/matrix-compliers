import React from "react";

export default function Hero({ locations, location, setLocation, onGenerate, loading }) {
  return (
    <div className="border-b border-line bg-gradient-to-b from-ink via-[#0E1A2B] to-ink">
      <div className="max-w-6xl mx-auto px-6 pt-14 pb-9">
        <div className="flex items-center gap-2 text-muted text-[13px] mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-amber shadow-[0_0_10px] shadow-amber" />
          Software model for climate-optimized shelter design
        </div>
        <h1 className="font-display text-[34px] leading-tight font-semibold max-w-xl mb-3">
          Design shelters that hold their heat after the sun goes down.
        </h1>
        <p className="text-muted max-w-lg text-[15px] leading-relaxed mb-7">
          Pick a region — from the Ladakh cold desert to coastal Chennai — and the engine fetches its climate
          signature, classifies it, and generates a shelter design that maximises passive solar gain by day and
          minimises heat loss by night.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="bg-panel2 border border-line rounded-lg px-4 py-3 text-sm min-w-[260px]"
          >
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
          <button
            onClick={onGenerate}
            disabled={loading}
            className="bg-amber text-[#1A1206] font-semibold rounded-lg px-5 py-3 text-sm hover:brightness-110 active:brightness-95 disabled:opacity-60"
          >
            {loading ? "Generating…" : "Generate design →"}
          </button>
        </div>
      </div>
    </div>
  );
}
