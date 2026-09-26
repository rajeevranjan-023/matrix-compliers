
const MATERIAL_DB = {
  "cold-arid": [
    { name: "Rammed earth wall + straw insulation", use: "Wall", uValue: 0.45, cost: 1450, avail: "High (local soil)", efficiency: 88 },
    { name: "Double-glazed low-E window", use: "Window", uValue: 2.6, cost: 5200, avail: "Medium (imported to region)", efficiency: 80 },
    { name: "Insulated mud-timber roof (poplar + willow mat)", use: "Roof", uValue: 0.4, cost: 1800, avail: "High (local timber)", efficiency: 85 },
    { name: "Trombe wall glazing panel", use: "Solar collector", uValue: 2.9, cost: 4600, avail: "Medium", efficiency: 78 },
  ],
  "cold-temperate": [
    { name: "Stone/brick cavity wall + mineral wool", use: "Wall", uValue: 0.55, cost: 1600, avail: "High", efficiency: 80 },
    { name: "Double-glazed timber window", use: "Window", uValue: 2.8, cost: 4800, avail: "Medium", efficiency: 75 },
    { name: "Pitched insulated timber roof", use: "Roof", uValue: 0.5, cost: 1700, avail: "High", efficiency: 78 },
  ],
  "hot-dry": [
    { name: "Thick stone/mud block wall", use: "Wall", uValue: 0.9, cost: 1100, avail: "High (local stone)", efficiency: 74 },
    { name: "Small recessed wood-jaali window", use: "Window", uValue: 3.8, cost: 2600, avail: "High", efficiency: 70 },
    { name: "Lime-washed flat/vaulted roof", use: "Roof", uValue: 0.85, cost: 1300, avail: "High", efficiency: 72 },
    { name: "Reflective lime plaster finish", use: "Exterior finish", uValue: null, cost: 350, avail: "High", efficiency: 65 },
  ],
  "hot-humid": [
    { name: "Fly-ash/lightweight concrete block wall", use: "Wall", uValue: 1.6, cost: 900, avail: "High", efficiency: 60 },
    { name: "Louvred timber/aluminium window", use: "Window", uValue: 4.5, cost: 2200, avail: "High", efficiency: 68 },
    { name: "Ventilated clay-tile pitched roof", use: "Roof", uValue: 1.4, cost: 1000, avail: "High", efficiency: 64 },
    { name: "Bamboo/reed screening (jaali)", use: "Shading", uValue: null, cost: 450, avail: "High (regional)", efficiency: 70 },
  ],
  composite: [
    { name: "Fly-ash brick wall + partial insulation", use: "Wall", uValue: 0.8, cost: 1200, avail: "High", efficiency: 72 },
    { name: "Double-glazed window w/ external shading", use: "Window", uValue: 3.0, cost: 4200, avail: "Medium", efficiency: 74 },
    { name: "Insulated flat roof, ventilated cavity", use: "Roof", uValue: 0.75, cost: 1400, avail: "High", efficiency: 73 },
  ],
};

function getMaterials(classification) {
  const materials = MATERIAL_DB[classification.key];
  const floorArea = 25;
  return {
    materials,
    estimatedEnvelopeCost: materials.reduce((a, m) => a + m.cost, 0) * floorArea,
    avgEfficiency: Math.round(materials.reduce((a, m) => a + m.efficiency, 0) / materials.length),
  };
}

module.exports = { getMaterials, MATERIAL_DB };
