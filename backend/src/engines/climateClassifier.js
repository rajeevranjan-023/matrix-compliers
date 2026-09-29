
function classifyClimate(d) {
  if (d.winterAvg <= 3 && d.diurnal >= 15 && d.humidity < 35) {
    return {
      key: "cold-arid",
      label: "",
      note:
        "Ladakh-type climate: strongest case for passive solar + thermal mass design. Heat must be captured by day and locked in overnight.",
    };
  }
  if (d.winterAvg <= 6) {
    return {
      key: "cold-temperate",
      label: "",
      note:
        "Snow-season cold with higher ambient humidity than a cold desert — insulation matters as much as solar capture.",
    };
  }
  if (d.summerAvg >= 36 && d.humidity < 40) {
    return {
      key: "hot-dry",
      label: "",
      note:
        "Daytime heat load dominates; design must block solar gain and use thermal mass to delay heat reaching the interior.",
    };
  }
  if (d.summerAvg >= 30 && d.humidity >= 65) {
    return {
      key: "hot-humid",
      label: "",
      note:
        "Comfort depends on airflow, not mass — the goal is shedding heat and moisture continuously, not storing anything.",
    };
  }
  return {
    key: "composite",
    label: "",
    note:
      "Distinct hot and cold seasons — the design has to compromise between insulation and ventilation strategies.",
  };
}

module.exports = { classifyClimate };
