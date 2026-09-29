import React from "react";

function Flow({ steps }) {
  return (
    <div className="flex flex-wrap items-center gap-2 my-4">
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <span className="bg-panel2 border border-line rounded-lg px-3 py-2 text-[13px] text-slate-100 whitespace-nowrap">{s}</span>
          {i < steps.length - 1 && <span className="text-amber text-[16px]">→</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-panel2 border border-line rounded-lg px-4 py-3 flex-1 min-w-[150px]">
      <div className="text-muted text-[11px] uppercase tracking-wide mb-1">{label}</div>
      <div className="font-mono text-[17px] font-semibold text-amber">{value}</div>
    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <div className="bg-panel border border-line rounded-xl p-5 mb-4">
      <h3 className="font-display text-[16px] font-semibold mb-3 flex items-center gap-2">
        <span>{icon}</span>{title}
      </h3>
      {children}
    </div>
  );
}

export default function ThermalStoragePage({ onBack }) {
  return (
    <div>
      <header className="border-b border-line px-5 py-3.5 flex items-center justify-between flex-wrap gap-2.5">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-amber shadow-[0_0_10px] shadow-amber" />
          <div>
            <h1 className="font-display text-[17px] font-semibold m-0">Solar Heat Storage</h1>
            <div className="text-muted text-[12px]">Day to night heating, explained</div>
          </div>
        </div>
        <button onClick={onBack} className="bg-panel2 border border-line text-slate-100 rounded-lg px-3 py-2 text-[12px] hover:border-amber">← Back</button>
      </header>

      <div className="max-w-[820px] mx-auto p-4 pb-10">
        <div className="bg-panel2 border border-amber/40 rounded-xl p-4 my-4 text-center">
          <p className="text-[15px] text-slate-100 m-0">We store daytime solar heat in water and use it at night, when it's actually needed.</p>
        </div>

        <Section icon="" title="What we're trying to solve">
          <p className="text-[14px] leading-relaxed text-slate-100">
            In places like Ladakh, daytime sun is strong but nights are extremely cold. Heating usually depends on fuel, which is expensive and hard to transport.
          </p>
          <p className="text-[14px] leading-relaxed text-slate-100 m-0">
            This system uses sunlight during the day, stores that heat in water, and uses it at night.
          </p>
        </Section>

        <Section icon="" title="What happens during the day">
          <p className="text-[14px] leading-relaxed text-slate-100">
            A solar collector sits facing south, tilted to match the local sun angle. Sunlight falls on a dark absorber plate inside it. That plate turns sunlight into heat and passes it to water flowing through pipes.
          </p>
          <Flow steps={[" Sun", " Panel", " Pipes", " Warm water"]} />
          <div className="flex flex-wrap gap-3 mt-3">
            <Stat label="Collector size" value="2 – 3 m²" />
            <Stat label="Water temp (clear day)" value="60 – 70°C" />
          </div>
        </Section>

        <Section icon="" title="How the heat is stored">
          <p className="text-[14px] leading-relaxed text-slate-100">
            The heated water goes into an insulated tank, usually steel with a thick insulation layer wrapped around it.
          </p>
          <Flow steps={[" Hot water inside", " Insulation", " Outer shell"]} />
          <div className="flex flex-wrap gap-3 mt-3 mb-3">
            <Stat label="Tank size" value="150 – 200 L" />
            <Stat label="Insulation" value="Foam / fibre layer" />
          </div>
          <p className="text-[13.5px] text-muted leading-relaxed m-0">
            With good insulation, the tank only loses about 5–10°C overnight.
          </p>
        </Section>

        <Section icon="" title="What happens at night">
          <p className="text-[14px] leading-relaxed text-slate-100">
            Once it's below freezing outside, the stored hot water gives up its heat inside the room, through wall-mounted pipes, a radiator panel, or floor loops. The water cools a little, flows back to the tank, and the loop keeps going.
          </p>
          <Flow steps={[" Tank", "〰 Pipe", " Room", "↩ Return"]} />
        </Section>

        <Section icon="📊" title="Real numbers">
          <p className="text-[14px] leading-relaxed text-slate-100 mb-3">
            A 200-litre tank heated to around 65°C can give useful heat for 6 to 8 hours. In a well-insulated room, indoor temperature can stay around 10–15°C even when it's below zero outside.
          </p>
          <div className="flex flex-wrap gap-3">
            <Stat label="Tank" value="200 L @ 65°C" />
            <Stat label="Heat duration" value="6 – 8 hrs" />
            <Stat label="Indoor (well insulated)" value="10 – 15°C" />
          </div>
        </Section>

        <Section icon="🔁" title="Daily cycle">
          <Flow steps={[" Morning — sunlight starts heating water", " Afternoon — maximum heat stored", " Evening — heat ready to use", " Night — heat released into room"]} />
        </Section>

        <Section icon="" title="If sunlight is strong, why doesn't snow melt easily?">
          <p className="text-[14px] leading-relaxed text-slate-100 mb-2">Three reasons:</p>
          <ul className="list-disc list-inside text-[14px] text-slate-100 space-y-1 mb-3">
            <li>Snow reflects most of the sunlight back</li>
            <li>Cold air pulls heat away quickly</li>
            <li>There's nothing there to store or trap that heat</li>
          </ul>
          <p className="text-[13.5px] text-sage leading-relaxed m-0 pl-3 border-l-2 border-sage/60">
            In this system, that heat is captured, stored, and protected from loss — instead of just being lost to the air.
          </p>
        </Section>

        <Section icon="" title="Storing heat efficiently">
          <ul className="list-disc list-inside text-[14px] text-slate-100 space-y-1 mb-3">
            <li>Use a well-insulated tank</li>
            <li>Keep the tank inside or close to the room</li>
            <li>Avoid long pipe runs left exposed to the cold</li>
            <li>Store more water rather than pushing the temperature too high</li>
          </ul>
          <Flow steps={[" Tank kept near room", " Short pipe run", " Room"]} />
        </Section>

        <Section icon="" title="How the heat is actually used">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-panel2 border border-line rounded-lg p-3">
              <div className="text-[13.5px] font-semibold text-slate-100 mb-1"> Wall pipes</div>
              <div className="text-[12.5px] text-muted">Slow, steady heating</div>
            </div>
            <div className="bg-panel2 border border-line rounded-lg p-3">
              <div className="text-[13.5px] font-semibold text-slate-100 mb-1"> Radiator panel</div>
              <div className="text-[12.5px] text-muted">Faster heating</div>
            </div>
            <div className="bg-panel2 border border-line rounded-lg p-3">
              <div className="text-[13.5px] font-semibold text-slate-100 mb-1"> Floor pipes</div>
              <div className="text-[12.5px] text-muted">Even, uniform heating</div>
            </div>
          </div>
        </Section>

        <Section icon="" title="Why this works">
          <ul className="list-none p-0 m-0 space-y-2">
            {[
              "Sun provides free energy every day",
              "Water stores heat for a long time",
              "Insulation prevents that heat from leaking away",
              "Stored heat is used exactly when it's needed most",
            ].map((l) => (
              <li key={l} className="text-[14px] text-slate-100 flex gap-2"><span className="text-amber">•</span>{l}</li>
            ))}
          </ul>
          <p className="text-[14px] text-sage leading-relaxed mt-3 mb-0">
            This system reduces dependence on fuel and uses natural energy effectively.
          </p>
        </Section>
      </div>
    </div>
  );
}
