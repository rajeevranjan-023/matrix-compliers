import React from "react";

export function Card({ children, className = "" }) {
  return <div className={`bg-panel border border-line rounded-[10px] p-5 ${className}`}>{children}</div>;
}

export function StatCard({ label, value, sub }) {
  return (
    <Card>
      <h3 className="text-muted text-[13px] mb-1.5">{label}</h3>
      <div className="text-[24px] font-semibold tabular-nums">{value}</div>
      {sub && <div className="text-muted text-xs mt-1">{sub}</div>}
    </Card>
  );
}

export function Badge({ children, tone = "cold" }) {
  const tones = {
    cold: "bg-[#1B3350] text-glacier",
    hot: "bg-[#3A2418] text-ember",
    humid: "bg-[#173028] text-sage",
    mix: "bg-[#2B2618] text-amber",
  };
  return <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export function badgeTone(classificationKey) {
  if (classificationKey.startsWith("cold")) return "cold";
  if (classificationKey === "hot-dry") return "hot";
  if (classificationKey === "hot-humid") return "humid";
  return "mix";
}
