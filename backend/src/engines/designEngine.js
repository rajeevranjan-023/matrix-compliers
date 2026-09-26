const DESIGN_RULES = {
  "cold-arid": {
    orientation:
      "Long axis east–west; primary facade faces true south (±10°) to maximise low-angle winter sun on the main glazing.",
    wallThickness:
      "450–600 mm — rammed earth or local stone with an internal insulation layer (R ≈ 2.5–3.0 m²K/W).",
    windowPlacement:
      "Large south-facing double/triple-glazed windows (18–22% of south wall area) acting as a Trombe-style solar collector; minimal north/east/west openings.",
    roofDesign:
      "Flat, heavily insulated mud-and-timber roof (traditional Ladakhi construction) with a reflective outer layer and sealed air gap to cut night-time radiative loss.",
    features: [
      "Trombe wall or attached sunspace on the south face",
      "Double-door airlock entry to cut infiltration",
      "Dark, heat-absorbing internal floor/wall mass behind glazing",
      "Insulated shutters closed at sunset to trap gained heat",
    ],
  },
  "cold-temperate": {
    orientation: "South-facing long facade, sheltered from the prevailing cold wind side.",
    wallThickness: "350–450 mm with cavity or board insulation (R ≈ 2.0–2.5 m²K/W).",
    windowPlacement: "Moderate south glazing (12–16%), double-glazed, with overhangs sized for summer shading.",
    roofDesign: "Pitched insulated roof (snow shedding) with a ventilated ridge and reflective underlay.",
    features: [
      "Vestibule entries",
      "Moisture-tolerant insulation (humidity is higher than cold-arid)",
      "Wind-break screening on the windward side",
    ],
  },
  "hot-dry": {
    orientation:
      "Long axis east–west to minimise east/west wall exposure to low-angle sun; internal courtyard for shaded outdoor space.",
    wallThickness: "400–500 mm high-mass wall (stone/mud/thick brick) to delay peak heat by 8–10 hours.",
    windowPlacement: "Small, high-set, deeply recessed openings (8–10% of wall area) with external shading (chajja/jaali).",
    roofDesign:
      "Thick insulated flat/vaulted roof, light-coloured or lime-washed to reflect solar radiation; optional roof pond or evaporative cooling.",
    features: [
      "Central shaded courtyard for night-time cool air pooling",
      "Jaali (perforated screen) openings for filtered airflow",
      "Light exterior colour, high solar reflectance",
    ],
  },
  "hot-humid": {
    orientation: "Long axis perpendicular to prevailing wind to maximise cross-ventilation.",
    wallThickness:
      "150–230 mm lightweight wall — thermal mass is a liability here; the goal is fast heat shedding, not storage.",
    windowPlacement:
      "Large, openable windows on opposite walls (25–30% of wall area) for continuous cross-ventilation; louvres over solid shutters.",
    roofDesign: "Steep pitched roof with a ventilated attic gap and wide eaves; light, reflective roofing to cut radiant heat.",
    features: [
      "Raised plinth/stilts to avoid ground moisture and improve airflow",
      "Wide verandah for shaded, ventilated transition space",
      "Operable louvres instead of sealed glazing",
    ],
  },
  composite: {
    orientation: "South-facing primary facade with movable shading — the same wall must work for both seasons.",
    wallThickness: "300–400 mm with insulation, moderate thermal mass.",
    windowPlacement: "Medium glazing ratio (14–18%) with adjustable external shading devices.",
    roofDesign: "Insulated roof with a ventilated cavity that can be sealed in winter and opened in summer.",
    features: [
      "Seasonally adjustable shading/insulated shutters",
      "Courtyard for summer cooling, sealed in winter",
      "Dual-mode ventilation (sealed in winter / open in summer)",
    ],
  },
};

function generateDesign(classification) {
  return DESIGN_RULES[classification.key];
}

module.exports = { generateDesign, DESIGN_RULES };
