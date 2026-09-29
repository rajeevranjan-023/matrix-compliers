import React from "react";
import { jsPDF } from "jspdf";

export default function PdfReportButton({ data }) {
  function handleClick() {
    if (!data) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    let y = 40;
    doc.setFontSize(16); doc.text("ShelterIQ — Design Report", 40, y); y += 22;
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text(`Location: ${data.inputs.location}  |  Climate: ${data.classification.label}`, 40, y); y += 16;
    doc.text(`Size: ${data.geometry.width}m x ${data.geometry.length}m, ${data.geometry.floors} floor(s)  |  Budget: ${data.inputs.budget}  |  Persona: ${data.inputs.persona}`, 40, y); y += 22;

    doc.setTextColor(0); doc.setFontSize(12); doc.text("Design recommendation", 40, y); y += 16;
    doc.setFontSize(9); doc.setTextColor(60);
    ["orientation", "wallThickness", "windowPlacement", "roofDesign"].forEach((f) => {
      const lines = doc.splitTextToSize(data.design[f].value, 500);
      doc.text(lines, 40, y); y += lines.length * 12 + 4;
    });

    y += 8;
    doc.setTextColor(0); doc.setFontSize(12); doc.text("Key results", 40, y); y += 16;
    doc.setFontSize(9); doc.setTextColor(60);
    [
      `Comfort score: ${data.comfortScore.overall}/100`,
      `${data.comparison.isCold ? "Night-time gain" : "Peak reduction"}: ${data.comparison.headlineGain >= 0 ? "+" : ""}${data.comparison.headlineGain}°C`,
      `Energy saved: ${data.comparison.energySavingPercent}%   |   CO2 avoided/day: ${data.sustainability.co2SavedKg} kg`,
      `Estimated envelope cost: Rs ${data.materials.estimatedEnvelopeCost.toLocaleString("en-IN")}`,
    ].forEach((r) => { doc.text(r, 40, y); y += 14; });

    y += 10;
    doc.setTextColor(0); doc.setFontSize(12); doc.setFont(undefined, "normal"); doc.text("24-hour simulation (°C)", 40, y); y += 14;
    doc.setFont("courier"); doc.setFontSize(8); doc.setTextColor(60);
    const sampleHours = [0, 3, 6, 9, 12, 15, 18, 21];
    doc.text("Hour     " + sampleHours.map((h) => String(h).padStart(5, " ")).join(""), 40, y); y += 12;
    doc.text("Outdoor  " + sampleHours.map((h) => data.simulation.outdoor[h].toFixed(1).padStart(5, " ")).join(""), 40, y); y += 12;
    doc.text("Baseline " + sampleHours.map((h) => data.simulation.baselineIndoor[h].toFixed(1).padStart(5, " ")).join(""), 40, y); y += 12;
    doc.text("Optimized" + sampleHours.map((h) => data.simulation.optimizedIndoor[h].toFixed(1).padStart(5, " ")).join(""), 40, y); y += 12;
    doc.setFont(undefined, "normal");

    doc.save(`ShelterIQ-${data.inputs.location.replace(/[^a-z0-9]/gi, "_")}.pdf`);
  }
  return (
    <button onClick={handleClick} disabled={!data}
      className="text-slate-200 text-[13px] px-3 py-2 hover:text-amber disabled:opacity-50">
      Download report
    </button>
  );
}
