import React from "react";

export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 border-b border-line overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`px-4 py-2.5 text-[14px] whitespace-nowrap border-b-2 ${
            active === t.id ? "text-slate-100 border-amber" : "text-muted border-transparent hover:text-slate-200"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
