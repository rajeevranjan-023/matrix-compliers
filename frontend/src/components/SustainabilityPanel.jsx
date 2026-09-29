import React from "react";

export default function SustainabilityPanel({ data }) {
  const { sustainability } = data;
  return (
    <div>
      <h2 className="text-[20px] font-semibold mb-3">Energy and CO₂</h2>
      <p className="text-[16px] leading-relaxed max-w-2xl mt-0 mb-6">
        A normal building would need about <b>{sustainability.baseKWh} kWh</b> a day for heating or cooling. Yours needs about <b>{sustainability.optKWh} kWh</b>.
        That's <b className="text-sage">{sustainability.savedKWh} kWh saved</b> every day, which is roughly <b className="text-sage">{sustainability.co2SavedKg} kg of CO₂</b> not released.
      </p>

      <div className="flex flex-wrap gap-x-10 gap-y-3 px-1">
        <div>
          <div className="text-[24px] font-semibold text-sage tabular-nums">{sustainability.savedKWh} kWh</div>
          <div className="text-muted text-[13px]">saved per day</div>
        </div>
        <div>
          <div className="text-[24px] font-semibold text-sage tabular-nums">{sustainability.co2SavedKg} kg</div>
          <div className="text-muted text-[13px]">CO₂ avoided per day</div>
        </div>
      </div>

      <p className="text-muted text-[12px] mt-6 leading-relaxed max-w-2xl">
        We assumed {sustainability.co2Factor} kg of CO₂ per kWh, which is close to India's average. Treat these as rough daily estimates, not a full yearly audit.
      </p>
    </div>
  );
}
