import React from "react";

function Flow({ steps }) {
  return (
    <div className="flex flex-wrap items-center gap-2 my-4">
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <span className="bg-panel2 border border-line rounded-lg px-3 py-1.5 text-[13px] text-slate-100">{s}</span>
          {i < steps.length - 1 && <span className="text-amber">→</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

function Fact({ label, value }) {
  return (
    <div>
      <div className="text-[19px] font-semibold text-amber tabular-nums">{value}</div>
      <div className="text-muted text-[12.5px]">{label}</div>
    </div>
  );
}

function Part({ title, children, className = "" }) {
  return (
    <section className={className}>
      <h2 className="text-[18px] font-semibold mb-2 mt-0">{title}</h2>
      {children}
    </section>
  );
}

const para = "text-[14.5px] leading-relaxed text-slate-200 mt-0 mb-3";

export default function ThermalStoragePage({ onBack }) {
  return (
    <div className="settle">
      <header className="border-b border-line px-5 py-3 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[17px] font-semibold m-0">Solar heat storage</h1>
          <div className="text-muted text-[12px]">Keeping daytime sun for the night</div>
        </div>
        <button onClick={onBack} className="bg-panel2 border border-line text-slate-100 rounded-lg px-4 py-2 text-[13px] hover:border-amber">← Back</button>
      </header>

      <div className="max-w-[760px] mx-auto px-5 pt-8 pb-14">
        <p className="text-[19px] leading-snug text-slate-100 mt-0 mb-9">
          The idea is simple: catch the sun's heat during the day, keep it in a tank of water, and use it at night when it's actually cold.
        </p>

        <Part title="The problem" className="mb-8">
          <p className={para}>
            In places like Ladakh the sun is strong in the day, but nights get very cold. Most people heat their homes with fuel, and fuel is expensive and hard to bring up there.
          </p>
          <p className={`${para} mb-0`}>
            So instead of burning something, we use the sun that's already there.
          </p>
        </Part>

        <Part title="During the day" className="mb-8">
          <p className={para}>
            A solar collector faces south, tilted to match the sun. Sunlight hits a dark plate inside it, the plate heats up, and that heat goes into water running through pipes.
          </p>
          <Flow steps={["Sun", "Panel", "Pipes", "Warm water"]} />
          <div className="flex flex-wrap gap-x-10 gap-y-3 mt-4">
            <Fact label="collector size" value="2 – 3 m²" />
            <Fact label="water temperature on a clear day" value="60 – 70°C" />
          </div>
        </Part>

        <Part title="Keeping the heat" className="mb-8">
          <p className={para}>
            The hot water goes into an insulated tank, usually steel with a thick layer of foam or fibre around it. Done well, the tank only loses about 5 to 10°C overnight.
          </p>
          <div className="flex flex-wrap gap-x-10 gap-y-3 mt-4">
            <Fact label="typical tank" value="150 – 200 L" />
          </div>
          <p className="text-muted text-[13.5px] leading-relaxed mt-4 mb-2">A few things that help:</p>
          <ul className="list-disc list-inside text-[14px] text-slate-200 space-y-1 m-0">
            <li>Insulate the tank well</li>
            <li>Keep it inside, or close to the room</li>
            <li>Don't leave long pipes out in the cold</li>
            <li>Use more water instead of heating it too hot</li>
          </ul>
        </Part>

        <Part title="At night" className="mb-8">
          <p className={para}>
            When it drops below freezing outside, the stored hot water gives its heat to the room. It cools a little, flows back to the tank, and the loop keeps going.
          </p>
          <Flow steps={["Tank", "Pipe", "Room", "Back to tank"]} />
          <p className={`${para} mb-0`}>
            You can release that heat three ways: pipes in the wall (slow and steady), a radiator panel (faster), or pipes under the floor (even all over).
          </p>
        </Part>

        <div className="border border-amber/40 rounded-xl px-5 py-4 mb-8">
          <div className="text-[14px] font-semibold mb-2">Rough numbers</div>
          <p className="text-[14px] leading-relaxed text-slate-200 mt-0 mb-3">
            A 200 litre tank heated to about 65°C can keep a room warm for 6 to 8 hours. In a well-insulated room, it can stay around 10 to 15°C inside even when it's below zero outside.
          </p>
          <div className="flex flex-wrap gap-x-10 gap-y-3">
            <Fact label="tank" value="200 L at 65°C" />
            <Fact label="heat lasts" value="6 – 8 hrs" />
            <Fact label="indoors, well insulated" value="10 – 15°C" />
          </div>
        </div>

        <Part title="A day in the life" className="mb-8">
          <Flow steps={["Morning: the sun starts heating the water", "Afternoon: the tank is at its hottest", "Evening: the heat is ready", "Night: it warms the room"]} />
        </Part>

        <Part title="Why doesn't snow just melt in strong sun?" className="mb-8">
          <ul className="list-disc list-inside text-[14px] text-slate-200 space-y-1 mt-0 mb-3">
            <li>Snow bounces most of the sunlight back</li>
            <li>Cold air pulls heat away fast</li>
            <li>Nothing is there to catch and keep the heat</li>
          </ul>
          <p className="text-[14px] text-sage leading-relaxed m-0">
            This system does the catching and keeping, so the heat isn't wasted on the air.
          </p>
        </Part>

        <p className="text-[14.5px] text-slate-200 leading-relaxed m-0">
          In short: the sun is free, water holds heat well, and insulation stops it leaking away. You use less fuel, and the warmth arrives right when you need it.
        </p>
      </div>
    </div>
  );
}
