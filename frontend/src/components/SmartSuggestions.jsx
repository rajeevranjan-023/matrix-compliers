import React from "react";

export default function SmartSuggestions({ data }) {
  const suggestions = data?.comfortScore?.suggestions || [];
  if (!suggestions.length) return null;
  const allGood = suggestions.length === 1 && suggestions[0].toLowerCase().startsWith("design parameters are well matched");

  return (
    <div className="bg-panel border border-line rounded-xl p-4">
      <h3 className="font-display text-[15px] font-semibold mb-3">
        {allGood ? "You're in good shape" : "Ways to make it better"}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {suggestions.map((s, i) => (
          <div key={i} className="flex gap-2.5 bg-panel2 border border-line rounded-lg px-3 py-2.5">
            <span className="text-[15px] leading-none mt-0.5">{allGood ? "✅" : "💡"}</span>
            <p className="text-[13px] text-slate-200 leading-snug m-0">{s}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
