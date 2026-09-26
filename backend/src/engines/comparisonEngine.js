
function heatingLoad(indoor, comfortMin) {
  return indoor.reduce((sum, t) => sum + Math.max(0, comfortMin - t), 0) * 50;
}
function coolingLoad(indoor, comfortMax) {
  return indoor.reduce((sum, t) => sum + Math.max(0, t - comfortMax), 0) * 50;
}

function compareDesigns(simulation, classification) {
  const isCold = classification.key.startsWith("cold");
  const loadFn = isCold ? (arr) => heatingLoad(arr, 16) : (arr) => coolingLoad(arr, 28);

  const baseLoad = loadFn(simulation.baselineIndoor);
  const optLoad = loadFn(simulation.optimizedIndoor);
  const energySavingPercent = baseLoad > 0 ? Math.max(0, Math.min(99, ((baseLoad - optLoad) / baseLoad) * 100)) : 0;

  const baseMin = Math.min(...simulation.baselineIndoor);
  const optMin = Math.min(...simulation.optimizedIndoor);
  const baseMax = Math.max(...simulation.baselineIndoor);
  const optMax = Math.max(...simulation.optimizedIndoor);

  return {
    energySavingPercent: Math.round(energySavingPercent),

    nightTemperatureGain: isCold ? +(optMin - baseMin).toFixed(1) : +(baseMax - optMax).toFixed(1),
    baselineNightMin: +baseMin.toFixed(1),
    optimizedNightMin: +optMin.toFixed(1),
  };
}

module.exports = { compareDesigns };
