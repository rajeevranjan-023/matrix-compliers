import React from "react";


export default function OrientationDiagram({ climateKey }) {
  const isCold = climateKey.startsWith("cold");
  return (
    <svg viewBox="0 0 220 200" width="220" height="200">
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#6FA8C9" />
        </marker>
      </defs>

      <rect x="60" y="50" width="100" height="100" rx="4" fill="none" stroke="#8FA0B5" strokeWidth="1.5" />
      <line x1="110" y1="20" x2="110" y2="42" stroke="#8FA0B5" strokeWidth="1.5" />
      <text x="110" y="14" fill="#8FA0B5" fontSize="11" textAnchor="middle">N</text>

      {isCold && (
        <>
          <line x1="70" y1="165" x2="90" y2="150" stroke="#E8934A" strokeWidth="2" />
          <line x1="110" y1="175" x2="110" y2="150" stroke="#E8934A" strokeWidth="2" />
          <line x1="150" y1="165" x2="130" y2="150" stroke="#E8934A" strokeWidth="2" />
          <rect x="80" y="140" width="60" height="10" fill="#E8934A" opacity="0.5" />
          <text x="110" y="192" fill="#E8934A" fontSize="11" textAnchor="middle">south sun → main glazing</text>
        </>
      )}

      {climateKey === "hot-dry" && (
        <>
          <rect x="60" y="50" width="14" height="100" fill="#D46A3E" opacity="0.35" />
          <rect x="146" y="50" width="14" height="100" fill="#D46A3E" opacity="0.35" />
          <rect x="95" y="85" width="30" height="30" fill="none" stroke="#6FA8C9" strokeWidth="1.2" strokeDasharray="2 2" />
          <text x="110" y="192" fill="#D46A3E" fontSize="11" textAnchor="middle">shaded E/W walls + courtyard</text>
        </>
      )}

      {climateKey === "hot-humid" && (
        <>
          <line x1="30" y1="100" x2="58" y2="100" stroke="#6FA8C9" strokeWidth="2" markerEnd="url(#arrow)" />
          <line x1="162" y1="100" x2="190" y2="100" stroke="#6FA8C9" strokeWidth="2" markerEnd="url(#arrow)" />
          <text x="110" y="192" fill="#6FA8C9" fontSize="11" textAnchor="middle">cross-ventilation, opposite walls</text>
        </>
      )}

      {climateKey === "composite" && (
        <>
          <line x1="80" y1="160" x2="100" y2="148" stroke="#E8934A" strokeWidth="2" />
          <line x1="110" y1="168" x2="110" y2="148" stroke="#E8934A" strokeWidth="2" />
          <line x1="140" y1="160" x2="120" y2="148" stroke="#E8934A" strokeWidth="2" />
          <rect x="80" y="138" width="60" height="8" fill="#6FA8C9" opacity="0.4" />
          <text x="110" y="192" fill="#8FA0B5" fontSize="11" textAnchor="middle">movable seasonal shading</text>
        </>
      )}
    </svg>
  );
}
