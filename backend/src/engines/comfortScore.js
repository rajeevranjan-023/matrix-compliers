const { uaTotal } = require("./simulationEngine");

const IDEAL_ACH = { "cold-arid": 0.45, "cold-temperate": 0.6, "hot-dry": 0.7, "hot-humid": 2.5, composite: 1.0 };
const SOLAR_TARGET = { "cold-arid": 0.65, "cold-temperate": 0.55, "hot-dry": 0.12, "hot-humid": 0.15, composite: 0.28 };
const UA_BOUNDS = {
  "cold-arid": { bad: 220, good: 35 },
  "cold-temperate": { bad: 220, good: 45 },
  "hot-dry": { bad: 220, good: 60 },
  "hot-humid": { bad: 280, good: 140 },
  composite: { bad: 220, good: 55 },
};
const WEIGHTS = {
  "cold-arid": { insulation: 0.45, ventilation: 0.25, solar: 0.3 },
  "cold-temperate": { insulation: 0.45, ventilation: 0.25, solar: 0.3 },
  "hot-dry": { insulation: 0.4, ventilation: 0.25, solar: 0.35 },
  "hot-humid": { insulation: 0.15, ventilation: 0.5, solar: 0.35 },
  composite: { insulation: 0.35, ventilation: 0.3, solar: 0.35 },
};

function computeComfortScore(params, classification) {
  const key = classification.key;
  const isCold = key.startsWith("cold");

  const UAref = uaTotal(params);
  const { bad, good } = UA_BOUNDS[key];
  const insulationScore = Math.max(0, Math.min(100, (100 * (bad - UAref)) / (bad - good)));

  const idealACH = IDEAL_ACH[key];
  const ventilationScore = Math.max(0, 100 - (Math.abs(params.ach - idealACH) / idealACH) * 100);

  const solarTarget = SOLAR_TARGET[key];
  const solarActual = params.shgc * params.orientationFactor;
  const solarScore = Math.max(0, 100 - (Math.abs(solarActual - solarTarget) / solarTarget) * 100);

  const w = WEIGHTS[key];
  const overall = Math.round(insulationScore * w.insulation + ventilationScore * w.ventilation + solarScore * w.solar);

  const suggestions = [];
  if (insulationScore < 65)
    suggestions.push(
      isCold
        ? "Increase wall/roof insulation thickness — the combined U-value is still letting too much heat escape at night."
        : "Envelope U-value is higher than ideal even for a ventilation-led design — consider a lighter but better-sealed wall assembly."
    );
  if (ventilationScore < 65)
    suggestions.push(
      isCold
        ? "Reduce infiltration (better door/window seals, an airlock entry) — ACH is higher than a cold climate can afford."
        : "Increase openable window area or add ridge ventilation — airflow is below what this climate needs for comfort."
    );
  if (solarScore < 65)
    suggestions.push(
      isCold
        ? "Enlarge south-facing glazing or add a Trombe wall to capture more usable daytime solar gain."
        : "Add external shading (chajja/jaali/louvres) on sun-facing openings — too much solar heat is entering during peak hours."
    );
  if (suggestions.length === 0) suggestions.push("Design parameters are well matched to this climate — no major corrections needed.");

  return {
    overall,
    insulationScore: Math.round(insulationScore),
    ventilationScore: Math.round(ventilationScore),
    solarScore: Math.round(solarScore),
    suggestions,
  };
}

module.exports = { computeComfortScore };
