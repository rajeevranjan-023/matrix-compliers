
const CLIMATE_DB = {
  "Leh, Ladakh":        { lat:34.16, lon:77.58, alt:3500, winterAvg:-8,  summerAvg:17, diurnal:20, humidity:28, solar:5.8, wind:14, snowDefault:true,  windDefault:false, coastalDefault:false },
  "Kargil, Ladakh":     { lat:34.55, lon:76.13, alt:2680, winterAvg:-10, summerAvg:24, diurnal:19, humidity:26, solar:5.6, wind:12, snowDefault:true,  windDefault:false, coastalDefault:false },
  "Srinagar, J&K":      { lat:34.08, lon:74.79, alt:1585, winterAvg:2,   summerAvg:24, diurnal:11, humidity:55, solar:4.6, wind:10, snowDefault:true,  windDefault:false, coastalDefault:false },
  "Shimla, HP":         { lat:31.10, lon:77.17, alt:2200, winterAvg:5,   summerAvg:21, diurnal:9,  humidity:60, solar:4.4, wind:11, snowDefault:true,  windDefault:false, coastalDefault:false },
  "Manali, HP":         { lat:32.24, lon:77.19, alt:2050, winterAvg:1,   summerAvg:19, diurnal:12, humidity:52, solar:4.8, wind:9,  snowDefault:true,  windDefault:false, coastalDefault:false },
  "Delhi, NCR":         { lat:28.61, lon:77.21, alt:216,  winterAvg:14,  summerAvg:34, diurnal:12, humidity:48, solar:5.2, wind:13, snowDefault:false, windDefault:false, coastalDefault:false },
  "Jaipur, Rajasthan":  { lat:26.91, lon:75.79, alt:431,  winterAvg:15,  summerAvg:36, diurnal:14, humidity:35, solar:5.7, wind:15, snowDefault:false, windDefault:true,  coastalDefault:false },
  "Jaisalmer, Rajasthan": { lat:26.91, lon:70.91, alt:225, winterAvg:12, summerAvg:41, diurnal:16, humidity:22, solar:6.1, wind:18, snowDefault:false, windDefault:true,  coastalDefault:false },
  "Ahmedabad, Gujarat": { lat:23.02, lon:72.57, alt:53,   winterAvg:18,  summerAvg:38, diurnal:11, humidity:45, solar:5.6, wind:12, snowDefault:false, windDefault:false, coastalDefault:false },
  "Nagpur, Maharashtra":{ lat:21.14, lon:79.08, alt:310,  winterAvg:16,  summerAvg:38, diurnal:13, humidity:42, solar:5.5, wind:11, snowDefault:false, windDefault:false, coastalDefault:false },
  "Mumbai, Maharashtra":{ lat:19.07, lon:72.87, alt:14,   winterAvg:20,  summerAvg:32, diurnal:5,  humidity:75, solar:4.9, wind:16, snowDefault:false, windDefault:false, coastalDefault:true },
  "Chennai, Tamil Nadu":{ lat:13.08, lon:80.27, alt:6,    winterAvg:22,  summerAvg:35, diurnal:6,  humidity:72, solar:5.3, wind:14, snowDefault:false, windDefault:false, coastalDefault:true },
  "Kolkata, WB":        { lat:22.57, lon:88.36, alt:9,    winterAvg:15,  summerAvg:34, diurnal:8,  humidity:70, solar:4.7, wind:10, snowDefault:false, windDefault:false, coastalDefault:true },
  "Guwahati, Assam":    { lat:26.14, lon:91.73, alt:55,   winterAvg:13,  summerAvg:32, diurnal:9,  humidity:78, solar:4.2, wind:8,  snowDefault:false, windDefault:false, coastalDefault:false },
  "Bengaluru, Karnataka": { lat:12.97, lon:77.59, alt:920, winterAvg:16, summerAvg:30, diurnal:9,  humidity:58, solar:5.1, wind:9,  snowDefault:false, windDefault:false, coastalDefault:false }
};


function classifyClimate(d) {
  if (d.winterAvg <= 3 && d.diurnal >= 15 && d.humidity < 35)
    return { key: "cold-arid", label: "Cold & Arid (High-Altitude Desert)", badge:"cold",
      note:"Ladakh-type climate: strongest case for passive solar + thermal mass design." };
  if (d.winterAvg <= 6)
    return { key: "cold-temperate", label: "Cold Temperate (Himalayan)", badge:"cold",
      note:"Snow-season cold with higher ambient humidity than a cold desert." };
  if (d.summerAvg >= 36 && d.humidity < 40)
    return { key: "hot-dry", label: "Hot & Dry (Arid Plains / Desert)", badge:"hot",
      note:"Daytime heat load dominates; design must block solar gain and use thermal mass to delay it." };
  if (d.summerAvg >= 30 && d.humidity >= 65)
    return { key: "hot-humid", label: "Hot & Humid (Coastal/Deltaic)", badge:"humid",
      note:"Comfort depends on airflow, not mass — shed heat and moisture continuously." };
  return { key: "composite", label: "Composite / Mixed", badge:"mix",
    note:"Distinct hot and cold seasons — the design compromises between insulation and ventilation." };
}


const CLIMATE_OPTIMAL = {
  "cold-arid":      { uWall:0.45, uRoof:0.40, uWindow:2.6, shgc:0.62, orientationFactor:1.00, ach:0.40, tau:28, glazingRatio:0.20 },
  "cold-temperate": { uWall:0.55, uRoof:0.50, uWindow:2.8, shgc:0.58, orientationFactor:0.90, ach:0.55, tau:18, glazingRatio:0.14 },
  "hot-dry":        { uWall:0.90, uRoof:0.85, uWindow:3.8, shgc:0.35, orientationFactor:0.30, ach:0.70, tau:22, glazingRatio:0.09 },
  "hot-humid":      { uWall:1.60, uRoof:1.40, uWindow:4.5, shgc:0.40, orientationFactor:0.30, ach:2.20, tau:5,  glazingRatio:0.27 },
  "composite":      { uWall:0.80, uRoof:0.75, uWindow:3.0, shgc:0.45, orientationFactor:0.55, ach:0.70, tau:14, glazingRatio:0.16 }
};
const BASELINE = { uWall:1.9, uRoof:1.6, uWindow:5.7, shgc:0.75, orientationFactor:0.5, ach:1.4, tau:5, glazingRatio:0.12 };
const MATERIAL_PROFILES = {
  brick: { uWall:1.10, costPerSqm:900,  label:"Fired brick (cavity wall)" },
  stone: { uWall:0.90, costPerSqm:1200, label:"Local stone masonry" },
  wood:  { uWall:1.30, costPerSqm:700,  label:"Timber-frame + infill" }
};
const BUDGET_LEVEL = { low:0.65, medium:1.0, high:1.35 };
const ENERGY_LEVEL = { "low-cost":0.7, balanced:1.0, "high-efficiency":1.3 };
function lerp(a,b,t){ return a + (b-a)*t; }


function geometryFor(areaSqft){
  const floorArea = Math.max(9, areaSqft/10.764);
  const side = Math.sqrt(floorArea);
  const roomHeight = 2.8;
  return { floorArea, wallArea: 4*side*roomHeight, roofArea: floorArea, roomHeight, volume: floorArea*roomHeight };
}


function buildDesignParams(inputs, classification){
  const key = classification.key;
  const optimal = CLIMATE_OPTIMAL[key];
  const geometry = geometryFor(inputs.areaSqft);

  const optimizationLevel = Math.min(1.4, Math.max(0.5,
    (BUDGET_LEVEL[inputs.budget] + ENERGY_LEVEL[inputs.energyPriority]) / 2));

  let uWall = lerp(BASELINE.uWall, optimal.uWall, optimizationLevel);
  let uRoof = lerp(BASELINE.uRoof, optimal.uRoof, optimizationLevel);
  let uWindow = lerp(BASELINE.uWindow, optimal.uWindow, optimizationLevel);
  const tCapped = Math.min(1, optimizationLevel);
  let ach = lerp(BASELINE.ach, optimal.ach, tCapped);
  let orientationFactor = lerp(BASELINE.orientationFactor, optimal.orientationFactor, tCapped);
  let tau = lerp(BASELINE.tau, optimal.tau, optimizationLevel);
  const shgc = optimal.shgc;

  let wallCostPerSqm = null;
  if (inputs.materialPref && inputs.materialPref !== "auto"){
    const profile = MATERIAL_PROFILES[inputs.materialPref];
    uWall = lerp(BASELINE.uWall, profile.uWall, optimizationLevel);
    wallCostPerSqm = profile.costPerSqm * BUDGET_LEVEL[inputs.budget];
  }

  uWall = Math.max(0.15, uWall);
  uRoof = Math.max(0.15, uRoof);
  uWindow = Math.max(1.2, uWindow);
  ach = Math.max(0.2, ach);
  tau = Math.max(4, Math.min(optimal.tau*1.3, tau));

  const notes = [];
  if (inputs.special.wind){
    ach *= 1.12;
    notes.push("High-wind exposure: infiltration allowance increased and window area trimmed on the windward face.");
  }
  if (inputs.special.snow){
    notes.push("Snow loading: roof structure and pitch sized for snow accumulation, with reinforced insulation at the eaves.");
  }
  if (inputs.special.coastal){
    ach *= 1.05;
    notes.push("Coastal exposure: corrosion-resistant fixtures and salt-tolerant finishes specified for the envelope.");
  }

  const wallShare = geometry.wallArea/4;
  const baselineWindowArea = wallShare * BASELINE.glazingRatio;
  const ventMultiplier = key === "hot-humid" ? 1.3 : 1.0;
  let optimizedWindowArea = wallShare * optimal.glazingRatio * ventMultiplier * Math.min(1, optimizationLevel+0.3);
  if (inputs.special.wind) optimizedWindowArea *= 0.85;

  return {
    geometry, optimizationLevel,
    baseline: { uWall:BASELINE.uWall, uRoof:BASELINE.uRoof, uWindow:BASELINE.uWindow, shgc:BASELINE.shgc,
      windowArea:baselineWindowArea, ach:BASELINE.ach*(inputs.special.wind?1.12:1), orientationFactor:BASELINE.orientationFactor, tau:BASELINE.tau },
    optimized: { uWall, uRoof, uWindow, shgc, windowArea:optimizedWindowArea, ach, orientationFactor, tau },
    wallCostPerSqm, notes
  };
}


function outdoorTempAt(hour, d, season){
  const base = season === "winter" ? d.winterAvg : (d.winterAvg + d.summerAvg)/2;
  const amp = d.diurnal/2;
  return base + amp*Math.cos(((hour-15)/24)*2*Math.PI);
}
function solarAt(hour, d){
  if (hour < 6 || hour > 18) return 0;
  const peakKW = d.solar/6;
  return Math.max(0, peakKW * Math.sin(((hour-6)/12)*Math.PI));
}
function uaTotal(p, geometry){
  return p.uWall*geometry.wallArea + p.uRoof*geometry.roofArea + p.uWindow*p.windowArea + 0.33*p.ach*geometry.volume;
}
function simulate(params, geometry, d, season){
  const totalHours = 24*7;
  const UA = uaTotal(params, geometry);
  const thermalMass = params.tau * UA;
  let T = [outdoorTempAt(0, d, season)];
  for (let h=1; h<totalHours; h++){
    const hr = h % 24;
    const Tout = outdoorTempAt(hr, d, season);
    const Qsolar = solarAt(hr, d) * params.windowArea * params.shgc * params.orientationFactor * 1000;
    const Qloss = UA * (T[h-1] - Tout);
    const dT = (Qsolar - Qloss) / thermalMass;
    T.push(T[h-1] + dT);
  }
  return T.slice(totalHours-24);
}
function metricsFor(indoor, outdoor){
  const min = Math.min(...indoor), max = Math.max(...indoor);
  const outMin = Math.min(...outdoor), outMax = Math.max(...outdoor);
  const swingIn = max-min, swingOut = outMax-outMin;
  const retention = swingOut>0 ? Math.max(0, Math.min(100, (1-swingIn/swingOut)*100)) : 0;
  return { min, max, swingIn, outMin, outMax, swingOut, retention };
}

const IDEAL_ACH = { "cold-arid":0.45, "cold-temperate":0.6, "hot-dry":0.7, "hot-humid":2.5, "composite":1.0 };
const SOLAR_TARGET = { "cold-arid":0.65, "cold-temperate":0.55, "hot-dry":0.12, "hot-humid":0.15, "composite":0.28 };
const UA_DENSITY_BOUNDS = {
  "cold-arid":{bad:8.8,good:1.4}, "cold-temperate":{bad:8.8,good:1.8}, "hot-dry":{bad:8.8,good:2.4},
  "hot-humid":{bad:11.2,good:5.6}, "composite":{bad:8.8,good:2.2}
};
const SCORE_WEIGHTS = {
  "cold-arid":{ins:.45,vent:.25,sol:.30}, "cold-temperate":{ins:.45,vent:.25,sol:.30},
  "hot-dry":{ins:.40,vent:.25,sol:.35}, "hot-humid":{ins:.15,vent:.50,sol:.35}, "composite":{ins:.35,vent:.30,sol:.35}
};
function comfortScore(params, geometry, classification){
  const key = classification.key;
  const isCold = key.startsWith("cold");
  const UAdensity = uaTotal(params, geometry) / geometry.floorArea;
  const { bad, good } = UA_DENSITY_BOUNDS[key];
  const insulationScore = Math.max(0, Math.min(100, 100*(bad-UAdensity)/(bad-good)));
  const idealACH = IDEAL_ACH[key];
  const ventilationScore = Math.max(0, 100 - Math.abs(params.ach-idealACH)/idealACH*100);
  const solarTarget = SOLAR_TARGET[key];
  const solarActual = params.shgc*params.orientationFactor;
  const solarScore = Math.max(0, 100 - Math.abs(solarActual-solarTarget)/solarTarget*100);
  const w = SCORE_WEIGHTS[key];
  const overall = Math.round(insulationScore*w.ins + ventilationScore*w.vent + solarScore*w.sol);

  const suggestions = [];
  if (insulationScore < 65) suggestions.push(isCold
    ? "Increase wall/roof insulation thickness — the combined U-value is still letting too much heat escape at night."
    : "Envelope U-value is higher than ideal even for a ventilation-led design — consider a lighter but better-sealed wall assembly.");
  if (ventilationScore < 65) suggestions.push(isCold ? "Reduce infiltration (better door/window seals, an airlock entry) — ACH is higher than a cold climate can afford." : "Increase openable window area or add ridge ventilation — airflow is below what this climate needs for comfort.");
  if (solarScore < 65) suggestions.push(isCold ? "Enlarge south-facing glazing or add a Trombe wall to capture more usable daytime solar gain." : "Add external shading (chajja/jaali/louvres) on sun-facing openings — too much solar heat is entering during peak hours.");
  if (suggestions.length===0) suggestions.push("Design parameters are well matched to this climate — no major corrections needed.");

  return { overall, insulationScore:Math.round(insulationScore), ventilationScore:Math.round(ventilationScore), solarScore:Math.round(solarScore), suggestions };
}


function compareDesigns(baselineIndoor, optimizedIndoor, classification, desiredTemp){
  const isCold = classification.key.startsWith("cold");
  const baseMin = Math.min(...baselineIndoor), optMin = Math.min(...optimizedIndoor);
  const baseMax = Math.max(...baselineIndoor), optMax = Math.max(...optimizedIndoor);
  return {
    headlineGain: isCold ? +(optMin-baseMin).toFixed(1) : +(baseMax-optMax).toFixed(1),
    isCold, baseMin, optMin };
}


const DESIGN_RULES = {
  "cold-arid": {
    orientation:{ value:"Long axis east–west; primary facade faces true south (±10°).", why:"Maximises exposure to low-angle winter sun, the main free heat source in a cold desert." },
    wallThickness:{ value:"450–600 mm high-mass wall (rammed earth/stone) with insulation.", why:"Thick mass stores the day's solar heat and releases it slowly overnight, when outdoor temperatures fall sharply." },
    windowPlacement:{ value:"Large south-facing double/triple-glazed windows (18–22% of south wall).", why:"Acts as a Trombe-style solar collector — larger south glazing captures more free daytime heat." },
    roofDesign:{ value:"Flat, heavily insulated roof with reflective outer layer and sealed air gap.", why:"Roofs lose heat fastest by night-sky radiation; sealing and insulating stops the day's gain escaping upward." },
    features: ["Trombe wall or attached sunspace on the south face","Double-door airlock entry to cut infiltration","Dark, heat-absorbing floor/wall mass behind glazing","Insulated shutters closed at sunset to trap gained heat"]
  },
  "cold-temperate": {
    orientation:{ value:"South-facing long facade, sheltered from the prevailing cold wind.", why:"Balances solar access with wind protection in a climate that is cold but not as dry as a high desert." },
    wallThickness:{ value:"350–450 mm with cavity or board insulation.", why:"Enough mass and insulation to buffer snow-season cold without the extreme thickness a desert climate needs." },
    windowPlacement:{ value:"Moderate south glazing (12–16%), double-glazed, with summer overhangs.", why:"Captures useful winter sun while the overhang blocks the higher summer sun angle to avoid overheating." },
    roofDesign:{ value:"Pitched insulated roof with ventilated ridge and reflective underlay.", why:"A pitch sheds snow safely; the ventilated ridge stops trapped moisture degrading the insulation." },
    features: ["Vestibule entries","Moisture-tolerant insulation","Wind-break screening on the windward side"]
  },
  "hot-dry": {
    orientation:{ value:"Long axis east–west; internal shaded courtyard.", why:"Minimises east/west wall area exposed to low-angle sun, the hardest heat to shade out." },
    wallThickness:{ value:"400–500 mm high-mass wall (stone/mud/thick brick).", why:"Delays peak heat reaching the interior by 8–10 hours, so the hottest hour outside lands after occupants have gone to sleep." },
    windowPlacement:{ value:"Small, high-set, deeply recessed openings (8–10% of wall area) with external shading.", why:"Every unshaded window is a direct solar heat path; small deep-set openings cut that gain drastically while still giving light." },
    roofDesign:{ value:"Thick insulated flat/vaulted roof, light-coloured or lime-washed.", why:"A reflective roof surface bounces back solar radiation instead of absorbing it." },
    features: ["Central shaded courtyard for night-time cool air pooling","Jaali (perforated screen) openings for filtered airflow","Light exterior colour, high solar reflectance"]
  },
  "hot-humid": {
    orientation:{ value:"Long axis perpendicular to the prevailing wind.", why:"Maximises cross-ventilation, the only practical way to shed heat and moisture in a humid climate." },
    wallThickness:{ value:"150–230 mm lightweight wall.", why:"Thermal mass is a liability here — it would store heat and humidity instead of letting the building breathe." },
    windowPlacement:{ value:"Large openable windows on opposite walls (25–30% of wall area), louvred.", why:"Continuous airflow evaporates moisture and carries heat out; louvres keep rain and sun out while airflow continues." },
    roofDesign:{ value:"Steep pitched roof, ventilated attic gap, wide eaves, light reflective roofing.", why:"A vented attic stops the roof's absorbed heat radiating into the room; wide eaves keep monsoon rain off the walls." },
    features: ["Raised plinth/stilts to avoid ground moisture and improve airflow","Wide verandah for shaded, ventilated transition space","Operable louvres instead of sealed glazing"]
  },
  composite: {
    orientation:{ value:"South-facing primary facade with movable shading.", why:"The same wall has to perform in both a hot summer and a cold winter, so shading needs to be adjustable." },
    wallThickness:{ value:"300–400 mm with insulation, moderate thermal mass.", why:"A middle ground — enough mass to buffer winter cold without becoming a liability in the hot months." },
    windowPlacement:{ value:"Medium glazing ratio (14–18%) with adjustable external shading.", why:"Shading is removed in winter to gain solar heat and deployed in summer to block it." },
    roofDesign:{ value:"Insulated roof with a ventilated cavity that can be sealed in winter and opened in summer.", why:"A switchable cavity lets the same roof retain heat in winter and vent it in summer." },
    features: ["Seasonally adjustable shading/insulated shutters","Courtyard for summer cooling, sealed in winter","Dual-mode ventilation (sealed in winter / open in summer)"]
  }
};
function generateDesign(classification, inputs, dp){
  const rules = DESIGN_RULES[classification.key];
  const notes = [...dp.notes];
  const warnings = [];
  if (inputs.materialPref && inputs.materialPref !== "auto"){
    const profile = MATERIAL_PROFILES[inputs.materialPref];
    notes.push(`Wall material set to ${profile.label} per your preference — this changes insulation performance from the climate's default recommendation.`);
    const optimalU = CLIMATE_OPTIMAL[classification.key].uWall;
    const isHotHumid = classification.key === "hot-humid";
    if (isHotHumid && profile.uWall < optimalU - 0.3){
      warnings.push(`${profile.label} is significantly heavier/more insulating than a hot-humid climate wants. Thermal mass traps heat and humidity here, so this choice can raise your daytime peak rather than lower it. "Auto" would select a lighter, breathable wall instead.`);
    }
    if (!isHotHumid && classification.key.startsWith("cold") && profile.uWall > optimalU + 0.4){
      warnings.push(`${profile.label} insulates noticeably worse than the climate-optimal wall for a cold region, so night-time heat retention will be lower than the design could achieve. Consider "Auto", or pair this material with added insulation.`);
    }
  }
  return { ...rules, notes, warnings };
}

const MATERIAL_DB = {
  "cold-arid":[
    {name:"Rammed earth wall + straw insulation", use:"Wall", uValue:0.45, baseCost:1450, avail:"High (local soil)", efficiency:88},
    {name:"Double-glazed low-E window", use:"Window", uValue:2.6, baseCost:5200, avail:"Medium (imported to region)", efficiency:80},
    {name:"Insulated mud-timber roof", use:"Roof", uValue:0.4, baseCost:1800, avail:"High (local timber)", efficiency:85},
    {name:"Trombe wall glazing panel", use:"Solar collector", uValue:2.9, baseCost:4600, avail:"Medium", efficiency:78}
  ],
  "cold-temperate":[
    {name:"Stone/brick cavity wall + mineral wool", use:"Wall", uValue:0.55, baseCost:1600, avail:"High", efficiency:80},
    {name:"Double-glazed timber window", use:"Window", uValue:2.8, baseCost:4800, avail:"Medium", efficiency:75},
    {name:"Pitched insulated timber roof", use:"Roof", uValue:0.5, baseCost:1700, avail:"High", efficiency:78}
  ],
  "hot-dry":[
    {name:"Thick stone/mud block wall", use:"Wall", uValue:0.9, baseCost:1100, avail:"High (local stone)", efficiency:74},
    {name:"Small recessed wood-jaali window", use:"Window", uValue:3.8, baseCost:2600, avail:"High", efficiency:70},
    {name:"Lime-washed flat/vaulted roof", use:"Roof", uValue:0.85, baseCost:1300, avail:"High", efficiency:72},
    {name:"Reflective lime plaster finish", use:"Exterior finish", uValue:null, baseCost:350, avail:"High", efficiency:65}
  ],
  "hot-humid":[
    {name:"Fly-ash/lightweight concrete block wall", use:"Wall", uValue:1.6, baseCost:900, avail:"High", efficiency:60},
    {name:"Louvred timber/aluminium window", use:"Window", uValue:4.5, baseCost:2200, avail:"High", efficiency:68},
    {name:"Ventilated clay-tile pitched roof", use:"Roof", uValue:1.4, baseCost:1000, avail:"High", efficiency:64},
    {name:"Bamboo/reed screening (jaali)", use:"Shading", uValue:null, baseCost:450, avail:"High (regional)", efficiency:70}
  ],
  composite:[
    {name:"Fly-ash brick wall + partial insulation", use:"Wall", uValue:0.8, baseCost:1200, avail:"High", efficiency:72},
    {name:"Double-glazed window w/ external shading", use:"Window", uValue:3.0, baseCost:4200, avail:"Medium", efficiency:74},
    {name:"Insulated flat roof, ventilated cavity", use:"Roof", uValue:0.75, baseCost:1400, avail:"High", efficiency:73}
  ]
};
function computeMaterials(classification, inputs, dp){
  const key = classification.key;
  const budgetMult = BUDGET_LEVEL[inputs.budget];
  let specialMult = 1;
  if (inputs.special.coastal) specialMult *= 1.15;
  if (inputs.special.wind) specialMult *= 1.08;
  const materials = MATERIAL_DB[key].map(m=>{
    let cost = m.baseCost*budgetMult*specialMult;
    let name = m.name, uValue = m.uValue;
    if (m.use==="Wall" && inputs.materialPref && inputs.materialPref!=="auto"){
      const profile = MATERIAL_PROFILES[inputs.materialPref];
      name = profile.label; uValue = profile.uValue; cost = dp.wallCostPerSqm*specialMult;
    }
    if (m.use==="Roof" && inputs.special.snow) cost *= 1.12;
    return { ...m, name, uValue, cost: Math.round(cost) };
  });
  const floorArea = dp.geometry.floorArea;
  const estimatedEnvelopeCost = Math.round(materials.reduce((a,m)=>a+m.cost,0)*floorArea);
  const avgEfficiency = Math.round(materials.reduce((a,m)=>a+m.efficiency,0)/materials.length);
  return { materials, estimatedEnvelopeCost, avgEfficiency };
}


function lerp(a,b,t){ return a+(b-a)*t; }


function geometryFor(areaSqft, floors){
  floors = Math.max(1, Math.min(4, Math.round(floors||1)));
  const totalArea = Math.max(9, areaSqft/10.764);
  const footprint = totalArea/floors;
  const side = Math.sqrt(footprint);
  const roomHeight = 2.8;
  const totalHeight = roomHeight*floors;
  return {
    floorArea: totalArea, footprint, side, floors, roomHeight, totalHeight,
    wallArea: 4*side*totalHeight,
    roofArea: footprint, // only the top floor has a roof
    volume: totalArea*roomHeight,
  };
}


const PERSONA_SEVERITY = {
  "urban":           { uMult:1.00, achMult:1.00, label:"Urban housing" },
  "rural":           { uMult:1.15, achMult:1.20, label:"Rural housing"  }, // typically less-sealed conventional construction
  "army":            { uMult:1.05, achMult:0.90, label:"Army / forward shelter" }, // often better-sealed, still uninsulated
  "disaster-relief": { uMult:1.45, achMult:1.60, label:"Disaster relief (tent/temporary)" }, // tents/tarps: poor insulation and high leakage
};


function azimuthFactor(classification, azimuthDeg){
  const isCold = classification.key.startsWith("cold");
  const rad = (azimuthDeg*Math.PI)/180;
  if (isCold || classification.key === "composite"){
    const raw = Math.cos(rad - Math.PI); // 1 at 180°, -1 at 0°
    return Math.max(0.15, (raw+1)/2 * 0.85 + 0.15); // rescale to [0.15,1.0]
  }

  const penalty = Math.abs(Math.sin(rad)); // 1 at E/W, 0 at N/S
  return Math.max(0.3, 1 - 0.7*penalty);
}


function buildDesignParamsV2(inputs, classification){
  const key = classification.key;
  const optimal = CLIMATE_OPTIMAL[key];
  const geometry = geometryFor(inputs.areaSqft, inputs.floors);
  const persona = PERSONA_SEVERITY[inputs.persona] || PERSONA_SEVERITY.urban;

  const optimizationLevel = Math.min(1.4, Math.max(0.5, inputs.optimizationLevel));

  let uWall = lerp(BASELINE.uWall, optimal.uWall, optimizationLevel);
  let uRoof = lerp(BASELINE.uRoof, optimal.uRoof, optimizationLevel);
  let uWindow = lerp(BASELINE.uWindow, optimal.uWindow, optimizationLevel);
  const tCapped = Math.min(1, optimizationLevel);
  let ach = lerp(BASELINE.ach, optimal.ach, tCapped);
  let tau = lerp(BASELINE.tau, optimal.tau, optimizationLevel);
  const shgc = optimal.shgc;

  let wallCostPerSqm = null;
  if (inputs.materialPref && inputs.materialPref !== "auto"){
    const profile = MATERIAL_PROFILES[inputs.materialPref];
    uWall = lerp(BASELINE.uWall, profile.uWall, optimizationLevel);
    wallCostPerSqm = profile.costPerSqm * BUDGET_LEVEL[inputs.budget];
  }

  const roofTypeMult = { flat:1.0, pitched:0.92, vaulted:0.88 }[inputs.roofType] || 1.0;
  uRoof *= roofTypeMult;

  uWall = Math.max(0.15, uWall); uRoof = Math.max(0.15, uRoof); uWindow = Math.max(1.2, uWindow);
  ach = Math.max(0.2, ach); tau = Math.max(4, Math.min(optimal.tau*1.3, tau));

  const notes = [];
  if (inputs.special.wind){ ach *= 1.12; notes.push("High-wind exposure: infiltration allowance increased, windward glazing trimmed."); }
  if (inputs.special.snow){ notes.push("Snow loading: roof structure and pitch sized for snow accumulation."); }
  if (inputs.special.coastal){ ach *= 1.05; notes.push("Coastal exposure: corrosion-resistant fixtures specified."); }
  if (inputs.special.heatwave){ notes.push("Heatwave allowance: summer design profile raised +4°C for a stress-test pass."); }


  const defaultAzimuth = classification.key.startsWith("cold") || classification.key === "composite" ? 180 : 180;
  const azimuth = inputs.orientationMode === "manual" ? inputs.azimuthDeg : defaultAzimuth;
  const orientationFactor = optimal.orientationFactor * azimuthFactor(classification, azimuth);

  const wallShare = geometry.wallArea/4;
  const ventMultiplier = key === "hot-humid" ? 1.3 : 1.0;
  const glazingRatio = inputs.windowWallMode === "manual" ? inputs.windowWallRatio : optimal.glazingRatio;
  let optimizedWindowArea = wallShare * glazingRatio * ventMultiplier * Math.min(1, optimizationLevel+0.3);
  if (inputs.special.wind) optimizedWindowArea *= 0.85;

  if (inputs.windowWallMode === "manual" && !key.startsWith("cold") && glazingRatio > optimal.glazingRatio*1.15){
    notes.push(`WARNING: a ${Math.round(glazingRatio*100)}% window-to-wall ratio is well above this climate's optimal (~${Math.round(optimal.glazingRatio*100)}%) — expect increased heat gain, potentially outweighing the wall/roof improvements.`);
  }

  const baseline = {
    uWall: BASELINE.uWall*persona.uMult, uRoof: BASELINE.uRoof*persona.uMult, uWindow: BASELINE.uWindow*persona.uMult,
    shgc: BASELINE.shgc, windowArea: wallShare*BASELINE.glazingRatio,
    ach: BASELINE.ach*persona.achMult*(inputs.special.wind?1.12:1),
    orientationFactor: BASELINE.orientationFactor, tau: BASELINE.tau,
  };

  return {
    geometry, optimizationLevel, persona, azimuth,
    baseline,
    optimized: { uWall, uRoof, uWindow, shgc, windowArea: optimizedWindowArea, ach, orientationFactor, tau },
    wallCostPerSqm, notes,
  };
}


function realLoadKWh(indoor, geometry, params, comfortMin, comfortMax, isCold){
  const UA = uaTotal(params, geometry); // W/K
  const degreeHours = indoor.reduce((s,t)=> s + (isCold ? Math.max(0, comfortMin-t) : Math.max(0, t-comfortMax)), 0);
  return (UA * degreeHours) / 1000; // kWh over the simulated 24h day
}

const CO2_FACTOR_KG_PER_KWH = 0.82;

function sustainabilityMetrics(baselineIndoor, optimizedIndoor, geometry, baseParams, optParams, classification, desiredTemp){
  const isCold = classification.key.startsWith("cold");
  const comfortMin = desiredTemp, comfortMax = desiredTemp+2;
  const baseKWh = realLoadKWh(baselineIndoor, geometry, baseParams, comfortMin, comfortMax, isCold);
  const optKWh  = realLoadKWh(optimizedIndoor, geometry, optParams, comfortMin, comfortMax, isCold);
  const savedKWh = Math.max(0, baseKWh-optKWh);
  const co2SavedKg = +(savedKWh*CO2_FACTOR_KG_PER_KWH).toFixed(2);
  return { baseKWh:+baseKWh.toFixed(2), optKWh:+optKWh.toFixed(2), savedKWh:+savedKWh.toFixed(2), co2SavedKg, co2Factor:CO2_FACTOR_KG_PER_KWH };
}


function scanSuggestions(inputs, classification, dp, climateData, season, currentMetrics, currentScore){
  const trials = [
    { label:"20% thicker/better-insulated wall", tweak:(p)=>({...p, uWall:p.uWall*0.8}) },
    { label:"Upgrading to double-glazed windows", tweak:(p)=>({...p, uWindow:Math.max(1.2,p.uWindow*0.75)}) },
    { label:"Tighter door/window sealing (-15% ACH)", tweak:(p)=>({...p, ach:Math.max(0.2,p.ach*0.85)}) },
  ];
  const results = [];
  for (const t of trials){
    const trialParams = t.tweak(dp.optimized);
    const trialIndoor = simulate(trialParams, dp.geometry, climateData, season);
    const trialMetrics = metricsFor(trialIndoor, Array.from({length:24},(_,h)=>outdoorTempAt(h,climateData,season)));
    const trialScore = comfortScore(trialParams, dp.geometry, classification);
    const retentionGain = trialMetrics.retention - currentMetrics.retention;
    const scoreGain = trialScore.overall - currentScore.overall;
    if (retentionGain > 2 || scoreGain > 2){
      results.push({ label:t.label, retentionGain:+retentionGain.toFixed(1), scoreGain });
    }
  }
  return results.sort((a,b)=>b.scoreGain-a.scoreGain);
}


function heatwaveStressTest(climateData, classification, dp){
  const stressed = { ...climateData, summerAvg: climateData.summerAvg + 4 };
  const normalOutdoor = Array.from({length:24},(_,h)=>outdoorTempAt(h, climateData, "summer"));
  const normalIndoor = simulate(dp.optimized, dp.geometry, climateData, "summer");
  const normalMetrics = metricsFor(normalIndoor, normalOutdoor);
  const stressedOutdoor = Array.from({length:24},(_,h)=>outdoorTempAt(h, stressed, "summer"));
  const stressedIndoor = simulate(dp.optimized, dp.geometry, stressed, "summer");
  const stressedMetrics = metricsFor(stressedIndoor, stressedOutdoor);
  return {
    normalPeak: +normalMetrics.max.toFixed(1),
    stressedPeak: +stressedMetrics.max.toFixed(1),
    peakIncrease: +(stressedMetrics.max - normalMetrics.max).toFixed(1),
  };
}


function nearestLocation(lat, lon){
  let best = null, bestD = Infinity;
  for (const name in CLIMATE_DB){
    const d = CLIMATE_DB[name];
    const dist = Math.hypot(d.lat-lat, d.lon-lon);
    if (dist < bestD){ bestD = dist; best = name; }
  }
  return { name: best, approxKm: Math.round(bestD*111) };
}

function runFor(inp){
  const d = CLIMATE_DB[inp.location];
  const c = classifyClimate(d);
  const dp = buildDesignParamsV2(inp, c);
  const design = generateDesign(c, inp, dp);
  const materials = computeMaterials(c, inp, dp);
  const season = c.key.startsWith("cold") ? "winter" : "summer";
  const outdoor = Array.from({length:24}, (_,h)=>outdoorTempAt(h,d,season));
  const baselineIndoor = simulate(dp.baseline, dp.geometry, d, season);
  const optimizedIndoor = simulate(dp.optimized, dp.geometry, d, season);
  const baselineMetrics = metricsFor(baselineIndoor, outdoor);
  const optimizedMetrics = metricsFor(optimizedIndoor, outdoor);
  const score = comfortScore(dp.optimized, dp.geometry, c);
  const baselineScore = comfortScore(dp.baseline, dp.geometry, c);
  const comparison = compareDesigns(baselineIndoor, optimizedIndoor, c, inp.desiredTemp);
  const sustainability = sustainabilityMetrics(baselineIndoor, optimizedIndoor, dp.geometry, dp.baseline, dp.optimized, c, inp.desiredTemp);

  comparison.energySavingPercent = sustainability.baseKWh > 0
    ? Math.round(Math.max(0, Math.min(99, (sustainability.savedKWh/sustainability.baseKWh)*100)))
    : 0;
  const suggestions = scanSuggestions(inp, c, dp, d, season, optimizedMetrics, score);
  const heatwave = heatwaveStressTest(d, c, dp);
  return { inputs: inp, d, classification:c, dp, design, materials, season,
    simulation:{ hours:Array.from({length:24},(_,h)=>h), outdoor, baselineIndoor, optimizedIndoor, baselineMetrics, optimizedMetrics },
    score, baselineScore, comparison, sustainability, suggestions, heatwave };
}




function lerp(a,b,t){ return a+(b-a)*t; }


function geometryForV4(widthM, lengthM, floors){
  floors = Math.max(1, Math.min(4, Math.round(floors||1)));
  const width = Math.max(3, Math.min(30, widthM||6));
  const length = Math.max(3, Math.min(30, lengthM||5));
  const roomHeight = 2.8;
  const totalHeight = roomHeight*floors;
  const footprint = width*length;
  const frontWallArea = width*totalHeight;  
  const sideWallArea = length*totalHeight;
  return {
    width, length, floors, roomHeight, totalHeight, footprint,
    floorArea: footprint*floors,
    wallArea: 2*frontWallArea + 2*sideWallArea,
    frontWallArea, sideWallArea,
    roofArea: footprint,
    volume: footprint*totalHeight,
  };
}


const REFERENCE_THICKNESS_MM = 300; 
function thicknessMultiplier(mm){
  const clamped = Math.max(80, Math.min(700, mm||REFERENCE_THICKNESS_MM));
  return Math.max(0.4, Math.min(2.5, REFERENCE_THICKNESS_MM/clamped));
}
const INSULATION_MULTIPLIER = { none:1.3, basic:1.0, high:0.7 };
const ROOF_MATERIAL_MULTIPLIER = { concrete:1.0, metal:1.15, thatch:0.85, insulated:0.6 };
const VENTILATION_MULTIPLIER = { natural:1.0, mechanical:0.85, none:0.4 };
const GLASS_BASE_U = { single: BASELINE.uWindow, double: null }; // null -> use climate-derived value


function buildDesignParamsV4(inputs, classification){
  const key = classification.key;
  const optimal = CLIMATE_OPTIMAL[key];
  const geometry = geometryForV4(inputs.widthM, inputs.lengthM, inputs.floors);
  const persona = PERSONA_SEVERITY[inputs.persona] || PERSONA_SEVERITY.urban;

  const optimizationLevel = Math.min(1.4, Math.max(0.5, inputs.optimizationLevel));
  const tCapped = Math.min(1, optimizationLevel);

  let uWall = lerp(BASELINE.uWall, optimal.uWall, optimizationLevel);
  let uRoof = lerp(BASELINE.uRoof, optimal.uRoof, optimizationLevel);
  let uWindowClimate = lerp(BASELINE.uWindow, optimal.uWindow, optimizationLevel);
  let ach = lerp(BASELINE.ach, optimal.ach, tCapped);
  let tau = lerp(BASELINE.tau, optimal.tau, optimizationLevel);
  const shgc = optimal.shgc;

  let wallCostPerSqm = null;
  if (inputs.materialPref && inputs.materialPref !== "auto"){
    const profile = MATERIAL_PROFILES[inputs.materialPref];
    uWall = lerp(BASELINE.uWall, profile.uWall, optimizationLevel);
    wallCostPerSqm = profile.costPerSqm * BUDGET_LEVEL[inputs.budget];
  }

  uWall *= thicknessMultiplier(inputs.wallThicknessMM);
  const insulMult = INSULATION_MULTIPLIER[inputs.insulationLevel] ?? 1.0;
  uWall *= insulMult;
  uRoof *= insulMult;
  uRoof *= ROOF_MATERIAL_MULTIPLIER[inputs.roofMaterial] ?? 1.0;
  ach *= VENTILATION_MULTIPLIER[inputs.ventilationType] ?? 1.0;

  const uWindow = inputs.glassType === "single" ? GLASS_BASE_U.single : uWindowClimate;

  const roofTypeMult = { flat:1.0, pitched:0.92, vaulted:0.88 }[inputs.roofType] || 1.0;
  uRoof *= roofTypeMult;

  uWall = Math.max(0.12, uWall); uRoof = Math.max(0.12, uRoof); const uWindowFinal = Math.max(1.1, uWindow);
  ach = Math.max(0.15, ach); tau = Math.max(4, Math.min(optimal.tau*1.3, tau));

  const notes = [];
  const warnings = [];
  if (inputs.special.wind){ ach *= 1.12; notes.push("High-wind exposure: infiltration allowance increased, windward glazing trimmed."); }
  if (inputs.special.snow){ notes.push("Snow loading: roof structure and pitch sized for snow accumulation."); }
  if (inputs.special.coastal){ ach *= 1.05; notes.push("Coastal exposure: corrosion-resistant fixtures specified."); }
  if (inputs.special.heatwave){ notes.push("Heatwave allowance: summer design profile raised +4°C for a stress-test pass."); }
  if (inputs.glassType === "single" && key.startsWith("cold")){
    warnings.push("Single glazing in a cold climate will leak far more heat than the recommended double glazing — expect a materially colder night minimum.");
  }
  if (inputs.ventilationType === "none" && key === "hot-humid"){
    warnings.push("Disabling ventilation in a hot-humid climate removes the only realistic cooling strategy this design has — comfort will suffer badly.");
  }

  const defaultAzimuth = 180; 
  const azimuth = inputs.orientationMode === "manual" ? inputs.azimuthDeg : defaultAzimuth;
  const orientationFactor = optimal.orientationFactor * azimuthFactor(classification, azimuth);

  const ventMultiplier = key === "hot-humid" ? 1.3 : 1.0;
  const glazingRatio = inputs.windowWallMode === "manual" ? inputs.windowWallRatio : optimal.glazingRatio;
  let optimizedWindowArea = geometry.frontWallArea * glazingRatio * ventMultiplier * Math.min(1, optimizationLevel+0.3);
  if (inputs.special.wind) optimizedWindowArea *= 0.85;

  if (inputs.windowWallMode === "manual" && !key.startsWith("cold") && glazingRatio > optimal.glazingRatio*1.15){
    warnings.push(`A ${Math.round(glazingRatio*100)}% window-to-wall ratio is well above this climate's optimal (~${Math.round(optimal.glazingRatio*100)}%) — expect increased heat gain, potentially outweighing the wall/roof improvements.`);
  }

  const baseline = {
    uWall: BASELINE.uWall*persona.uMult, uRoof: BASELINE.uRoof*persona.uMult, uWindow: BASELINE.uWindow*persona.uMult,
    shgc: BASELINE.shgc, windowArea: geometry.frontWallArea*BASELINE.glazingRatio,
    ach: BASELINE.ach*persona.achMult*(inputs.special.wind?1.12:1),
    orientationFactor: BASELINE.orientationFactor, tau: BASELINE.tau,
  };

  return {
    geometry, optimizationLevel, persona, azimuth,
    baseline,
    optimized: { uWall, uRoof, uWindow: uWindowFinal, shgc, windowArea: optimizedWindowArea, ach, orientationFactor, tau },
    wallCostPerSqm, notes, warnings,
  };
}


function generateDesignV4(classification, inputs, dp){
  const base = generateDesign(classification, inputs, dp); // material-preference conflict check
  return { ...base, warnings: [...(dp.warnings||[]), ...(base.warnings||[])] };
}

function runForV4(inp){
  const d = CLIMATE_DB[inp.location];
  const c = classifyClimate(d);
  const dp = buildDesignParamsV4(inp, c);
  const design = generateDesignV4(c, inp, dp);
  const materials = computeMaterials(c, inp, dp);
  const season = c.key.startsWith("cold") ? "winter" : "summer";
  const outdoor = Array.from({length:24}, (_,h)=>outdoorTempAt(h,d,season));
  const baselineIndoor = simulate(dp.baseline, dp.geometry, d, season);
  const optimizedIndoor = simulate(dp.optimized, dp.geometry, d, season);
  const baselineMetrics = metricsFor(baselineIndoor, outdoor);
  const optimizedMetrics = metricsFor(optimizedIndoor, outdoor);
  const score = comfortScore(dp.optimized, dp.geometry, c);
  const baselineScore = comfortScore(dp.baseline, dp.geometry, c);
  const comparison = compareDesigns(baselineIndoor, optimizedIndoor, c, inp.desiredTemp);
  const sustainability = sustainabilityMetrics(baselineIndoor, optimizedIndoor, dp.geometry, dp.baseline, dp.optimized, c, inp.desiredTemp);
  comparison.energySavingPercent = sustainability.baseKWh > 0
    ? Math.round(Math.max(0, Math.min(99, (sustainability.savedKWh/sustainability.baseKWh)*100))) : 0;
  const suggestions = scanSuggestions(inp, c, dp, d, season, optimizedMetrics, score);
  const heatwave = heatwaveStressTest(d, c, dp);
  return { inputs: inp, d, classification:c, dp, design, materials, season,
    simulation:{ hours:Array.from({length:24},(_,h)=>h), outdoor, baselineIndoor, optimizedIndoor, baselineMetrics, optimizedMetrics },
    score, baselineScore, comparison, sustainability, suggestions, heatwave };
}

module.exports = {
  CLIMATE_DB, classifyClimate, CLIMATE_OPTIMAL, BASELINE, MATERIAL_PROFILES,
  BUDGET_LEVEL, PERSONA_SEVERITY, azimuthFactor, geometryFor, buildDesignParamsV2,
  outdoorTempAt, solarAt, uaTotal, simulate, metricsFor,
  comfortScore, compareDesigns, generateDesign, computeMaterials, MATERIAL_DB, DESIGN_RULES,
  realLoadKWh, sustainabilityMetrics, scanSuggestions, heatwaveStressTest, CO2_FACTOR_KG_PER_KWH,
  nearestLocation, runFor,
  geometryForV4, buildDesignParamsV4, generateDesignV4, runForV4,
  thicknessMultiplier, INSULATION_MULTIPLIER, ROOF_MATERIAL_MULTIPLIER, VENTILATION_MULTIPLIER,
};
