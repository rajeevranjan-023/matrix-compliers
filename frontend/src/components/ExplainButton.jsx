import React from "react";

function buildExplanationText(data) {
  const { comparison, design, classification, score, inputs } = data;
  const gain = comparison.headlineGain;
  const gainPhrase = comparison.isCold
    ? `keeps the night-time indoor temperature about ${Math.abs(gain)} degrees Celsius warmer than a typical baseline structure`
    : `reduces the daytime peak indoor temperature by about ${Math.abs(gain)} degrees Celsius compared to a typical baseline structure`;
  return `This design is for ${inputs.location}, a ${classification.label} climate. ` +
    `${design.orientation.value} ${design.orientation.why} ` +
    `${design.wallThickness.value} ${design.wallThickness.why} ` +
    `${design.windowPlacement.value} ` +
    `Overall, this design ${gainPhrase}, saving an estimated ${comparison.energySavingPercent} percent of conditioning energy, ` +
    `with a comfort score of ${score.overall} out of 100.`;
}

export default function ExplainButton({ data }) {
  function handleClick() {
    if (!data || !("speechSynthesis" in window)) { alert("Speech synthesis is not available in this browser."); return; }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(buildExplanationText(data));
    utter.rate = 0.98;
    window.speechSynthesis.speak(utter);
  }
  return (
    <button onClick={handleClick} disabled={!data}
      className="flex items-center gap-1.5 bg-panel2 border border-line text-slate-100 rounded-lg px-3 py-2 text-[12px] hover:border-amber disabled:opacity-50">
      🔊 Explain design
    </button>
  );
}
