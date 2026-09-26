const https = require("https");
const { CLIMATE_DB } = require("../engines/core");

/** Fetch a small JSON payload over HTTPS without adding a dependency. */
function getJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => { try { resolve(JSON.parse(body)); } catch (e) { reject(e); } });
    }).on("error", reject);
  });
}

function findFallback(locationQuery) {
  const key = String(locationQuery || "").toLowerCase().trim();
  const match = Object.keys(CLIMATE_DB).find((name) => {
    const n = name.toLowerCase();
    return n === key || n.includes(key) || key.includes(n.split(",")[0].trim());
  });
  return { name: match || "Leh, Ladakh", data: CLIMATE_DB[match || "Leh, Ladakh"] };
}

/**
 * Returns a climate profile for a location.
 *
 * If OPENWEATHER_API_KEY is set, live current conditions refine the
 * humidity/temperature figures on top of the regional baseline — OpenWeather's
 * free endpoints don't provide long-run seasonal averages, diurnal swing, or
 * solar irradiance, so the baseline still anchors those.
 */
async function getClimateData(locationQuery) {
  const { name, data } = findFallback(locationQuery);
  const baseline = { ...data, name };
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) return { ...baseline, source: "fallback-dataset" };

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(locationQuery)}&units=metric&appid=${apiKey}`;
    const live = await getJson(url);
    if (Number(live.cod) !== 200) {
      return { ...baseline, source: "fallback-dataset (not found on OpenWeather)" };
    }
    return {
      ...baseline,
      lat: live.coord?.lat ?? baseline.lat,
      lon: live.coord?.lon ?? baseline.lon,
      humidity: live.main?.humidity ?? baseline.humidity,
      wind: live.wind?.speed != null ? Math.round(live.wind.speed * 3.6) : baseline.wind,
      liveTemp: live.main?.temp,
      source: "openweather+baseline",
    };
  } catch {
    return { ...baseline, source: "fallback-dataset (openweather request failed)" };
  }
}

module.exports = { getClimateData };
