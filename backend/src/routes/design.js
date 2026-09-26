const express = require("express");
const router = express.Router();

const { getClimateData } = require("../services/weatherService");
const { CLIMATE_DB, PERSONA_SEVERITY, runForV4 } = require("../engines/core");

const VALID_PERSONAS = Object.keys(PERSONA_SEVERITY);

function num(val, fallback) {
  const n = Number(val);
  return val === undefined || val === null || val === "" || Number.isNaN(n) ? fallback : n;
}

function normalizeInputs(body) {
  const location = body.location || "Leh, Ladakh";
  const climate = CLIMATE_DB[location];
  return {
    location,
    widthM: Math.max(3, Math.min(30, num(body.widthM, 6))),
    lengthM: Math.max(3, Math.min(30, num(body.lengthM, 5))),
    floors: Math.max(1, Math.min(4, Math.round(num(body.floors, 1)))),
    roomType: ["residential", "office", "shelter"].includes(body.roomType) ? body.roomType : "residential",
    budget: ["low", "medium", "high"].includes(body.budget) ? body.budget : "medium",
    optimizationLevel: Math.min(1.4, Math.max(0.5, num(body.optimizationLevel, 1.0))),
    desiredTemp: Math.min(24, Math.max(18, num(body.desiredTemp, 21))),
    materialPref: ["auto", "brick", "stone", "wood"].includes(body.materialPref) ? body.materialPref : "auto",
    roofType: ["flat", "pitched", "vaulted"].includes(body.roofType) ? body.roofType : "flat",
    roofMaterial: ["concrete", "metal", "thatch", "insulated"].includes(body.roofMaterial) ? body.roofMaterial : "concrete",
    persona: VALID_PERSONAS.includes(body.persona) ? body.persona : "urban",
    orientationMode: body.orientationMode === "manual" ? "manual" : "auto",
    azimuthDeg: Math.max(0, Math.min(359, num(body.azimuthDeg, 180))),
    windowWallMode: body.windowWallMode === "manual" ? "manual" : "auto",
    windowWallRatio: Math.max(0.05, Math.min(0.4, num(body.windowWallRatio, 0.18))),
    wallThicknessMM: Math.max(80, Math.min(700, num(body.wallThicknessMM, 300))),
    insulationLevel: ["none", "basic", "high"].includes(body.insulationLevel) ? body.insulationLevel : "basic",
    glassType: ["single", "double"].includes(body.glassType) ? body.glassType : "double",
    ventilationType: ["natural", "mechanical", "none"].includes(body.ventilationType) ? body.ventilationType : "natural",
    special: {
      snow: body.special?.snow ?? climate?.snowDefault ?? false,
      wind: body.special?.wind ?? climate?.windDefault ?? false,
      coastal: body.special?.coastal ?? climate?.coastalDefault ?? false,
      heatwave: body.special?.heatwave ?? false,
    },
  };
}

router.post("/design", async (req, res) => {
  try {
    const inputs = normalizeInputs(req.body || {});
    const climateData = await getClimateData(inputs.location);
    const resolvedLocation = climateData.name || inputs.location;
    const fellBack = resolvedLocation !== inputs.location;
    inputs.location = resolvedLocation;

    const original = CLIMATE_DB[resolvedLocation];
    CLIMATE_DB[resolvedLocation] = { ...original, ...climateData, name: undefined };

    const result = runForV4(inputs);

    CLIMATE_DB[resolvedLocation] = original; // restore — never leave a live request's patch behind

    res.json({
      inputs: result.inputs,
      locationFallback: fellBack ? { requested: req.body?.location, resolvedTo: resolvedLocation } : null,
      location: { ...result.d, name: resolvedLocation },
      classification: result.classification,
      design: result.design,
      materials: result.materials,
      geometry: {
        width: +result.dp.geometry.width.toFixed(2),
        length: +result.dp.geometry.length.toFixed(2),
        floors: result.dp.geometry.floors,
        roomHeight: result.dp.geometry.roomHeight,
        totalHeight: +result.dp.geometry.totalHeight.toFixed(2),
        footprint: +result.dp.geometry.footprint.toFixed(1),
        floorArea: +result.dp.geometry.floorArea.toFixed(1),
        wallArea: +result.dp.geometry.wallArea.toFixed(1),
        frontWallArea: +result.dp.geometry.frontWallArea.toFixed(1),
        sideWallArea: +result.dp.geometry.sideWallArea.toFixed(1),
        optimizationLevel: +result.dp.optimizationLevel.toFixed(2),
        azimuth: result.dp.azimuth,
      },
      designParams: { baseline: result.dp.baseline, optimized: result.dp.optimized },
      simulation: {
        hours: result.simulation.hours,
        outdoor: result.simulation.outdoor.map((v) => +v.toFixed(2)),
        baselineIndoor: result.simulation.baselineIndoor.map((v) => +v.toFixed(2)),
        optimizedIndoor: result.simulation.optimizedIndoor.map((v) => +v.toFixed(2)),
        baselineMetrics: result.simulation.baselineMetrics,
        optimizedMetrics: result.simulation.optimizedMetrics,
      },
      comfortScore: result.score,
      baselineScore: result.baselineScore,
      comparison: result.comparison,
      sustainability: result.sustainability,
      suggestions: result.suggestions,
      heatwave: result.heatwave,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate design", detail: err.message });
  }
});

router.get("/locations", (req, res) => {
  res.json(Object.entries(CLIMATE_DB).map(([name, d]) => ({
    name, lat: d.lat, lon: d.lon,
    defaults: { snow: d.snowDefault, wind: d.windDefault, coastal: d.coastalDefault },
  })));
});

module.exports = router;
