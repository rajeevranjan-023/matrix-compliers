const { MATERIAL_DB } = require("./materialEngine");

const GEOMETRY = { floorArea: 25, wallArea: 60, roofArea: 25, roomHeight: 2.8 };
const VOLUME = GEOMETRY.floorArea * GEOMETRY.roomHeight;

const TAU_HOURS = {
  "cold-arid": 28, // thick mass, long retention
  "cold-temperate": 18,
  "hot-dry": 22, 
  "hot-humid": 5, // lightweight, fast-responding, ventilation-led
  composite: 14,
};

const SOLAR_FACTOR = {
  "cold-arid": 1.0, 
  "cold-temperate": 0.9,
  "hot-dry": 0.3, // deep-recessed, heavily shaded openings
  "hot-humid": 0.3, // louvred, cross-vent oriented, not sun-facing
  composite: 0.55, // seasonal/adjustable shading
};

const SHGC = {
  "cold-arid": 0.62,
  "cold-temperate": 0.58,
  "hot-dry": 0.35,
  "hot-humid": 0.4,
  composite: 0.45,
};

function outdoorTempAt(hour, d, season) {
  const base = season === "winter" ? d.winterAvg : (d.winterAvg + d.summerAvg) / 2;
  const amp = d.diurnal / 2;
  return base + amp * Math.cos(((hour - 15) / 24) * 2 * Math.PI); // trough ~4am, peak ~3pm
}

function solarAt(hour, d) {
  if (hour < 6 || hour > 18) return 0;
  const peakKW = d.solar / 6;
  return Math.max(0, peakKW * Math.sin(((hour - 6) / 12) * Math.PI));
}

function uaTotal(p) {
  return p.uWall * GEOMETRY.wallArea + p.uRoof * GEOMETRY.roofArea + p.uWindow * p.windowArea + 0.33 * p.ach * VOLUME;
}

function buildParams(mode, classification, glazingArea = 4.4) {
  if (mode === "baseline") {
    return {
      uWall: 1.9,
      uRoof: 1.6,
      uWindow: 5.7,
      shgc: 0.75,
      windowArea: 3.0,
      ach: 1.4,
      orientationFactor: 0.5,
      tau: 5, // light, uninsulated, fast-responding conventional shed
    };
  }
  const key = classification.key;
  const mats = MATERIAL_DB[key];
  const wallU = mats.find((m) => m.use === "Wall")?.uValue ?? 0.8;
  const roofU = mats.find((m) => m.use === "Roof")?.uValue ?? 0.8;
  const winU = mats.find((m) => m.use === "Window")?.uValue ?? 3.0;
  const isCold = key.startsWith("cold");
  const isHotHumid = key === "hot-humid";

  return {
    uWall: wallU,
    uRoof: roofU,
    uWindow: winU,
    shgc: SHGC[key],
    windowArea: isCold ? glazingArea : isHotHumid ? glazingArea * 1.3 : glazingArea * 0.5,
    ach: isCold ? 0.4 : isHotHumid ? 2.2 : 0.7,
    orientationFactor: SOLAR_FACTOR[key],
    tau: TAU_HOURS[key],
  };
}

function simulate(params, d, season) {
  const totalHours = 24 * 7; // simulate a week so long-tau designs reach a stable cycle
  const UA = uaTotal(params);
  const thermalMass = params.tau * UA;
  const T = [outdoorTempAt(0, d, season)];
  for (let h = 1; h < totalHours; h++) {
    const hr = h % 24;
    const Tout = outdoorTempAt(hr, d, season);
    const Qsolar = solarAt(hr, d) * params.windowArea * params.shgc * params.orientationFactor * 1000;
    const Qloss = UA * (T[h - 1] - Tout);
    const dT = (Qsolar - Qloss) / thermalMass;
    T.push(T[h - 1] + dT);
  }
  return T.slice(totalHours - 24); // final, stabilised day
}

function metricsFor(indoor, outdoor) {
  const min = Math.min(...indoor);
  const max = Math.max(...indoor);
  const outMin = Math.min(...outdoor);
  const outMax = Math.max(...outdoor);
  const swingIn = max - min;
  const swingOut = outMax - outMin;
  const retention = swingOut > 0 ? Math.max(0, Math.min(100, (1 - swingIn / swingOut) * 100)) : 0;
  return { min, max, swingIn, outMin, outMax, swingOut, retention };
}

function runSimulation(climateData, classification) {
  const season = classification.key.startsWith("cold") ? "winter" : "summer";
  const hours = Array.from({ length: 24 }, (_, h) => h);
  const outdoor = hours.map((h) => outdoorTempAt(h, climateData, season));

  const baseParams = buildParams("baseline", classification);
  const optParams = buildParams("optimized", classification);

  const baselineIndoor = simulate(baseParams, climateData, season);
  const optimizedIndoor = simulate(optParams, climateData, season);

  return {
    hours,
    outdoor,
    baselineIndoor,
    optimizedIndoor,
    baseParams,
    optParams,
    baselineMetrics: metricsFor(baselineIndoor, outdoor),
    optimizedMetrics: metricsFor(optimizedIndoor, outdoor),
  };
}

module.exports = { runSimulation, buildParams, metricsFor, uaTotal, GEOMETRY, VOLUME };
