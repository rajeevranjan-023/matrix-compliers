import React from "react";

export default function SmartSuggestions({ data }) {
  const suggestions = data?.comfortScore?.suggestions || [];
  if (!suggestions.length) return null;
  const allGood = suggestions.length === 1 && suggestions[0].toLowerCase().startsWith("design parameters are well matched");

  return (
    <div className="border-l-2 border-amber pl-5 py-1">
      <h3 className="text-[16px] font-semibold mb-2 mt-0">
        {allGood ? "This already looks good" : "Things you could try"}
      </h3>
      <ul className="list-none m-0 p-0 space-y-1.5 max-w-3xl">
        {suggestions.map((s, i) => (
          <li key={i} className="text-[13.5px] text-slate-200 leading-relaxed">{s}</li>
        ))}
      </ul>
      {!allGood && <p className="text-muted text-[12px] mt-2.5 mb-0">You can change these anytime with the "Tweak it" panel on the right.</p>}
    </div>
  );
}
