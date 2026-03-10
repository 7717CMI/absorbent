const fs = require('fs');
const path = require('path');

const years = [2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033];

const regions = {
  "North America": ["U.S.", "Canada"],
  "Europe": ["U.K.", "Germany", "Italy", "France", "Spain", "Russia", "Rest of Europe"],
  "Asia Pacific": ["China", "India", "Japan", "South Korea", "ASEAN", "Australia", "Rest of Asia Pacific"],
  "Latin America": ["Brazil", "Argentina", "Mexico", "Rest of Latin America"],
  "Middle East & Africa": ["GCC", "South Africa", "Rest of Middle East & Africa"]
};

// New SAP market segments
const segmentTypes = {
  "By Product Type": {
    "Sodium Polyacrylate Based SAP": 0.58,
    "Polyacrylamide / Copolymer SAP": 0.22,
    "Cellulose-based SAP": 0.12,
    "Others (Polyethylene Glycol (PEG) blends, etc.)": 0.08
  },
  "By Physical Form": {
    "Powder": 0.35,
    "Beads / Granules": 0.30,
    "Fibers / Flakes": 0.18,
    "Gel Formulations (Pre-hydrated)": 0.17
  },
  "By Manufacturing Process": {
    "Solution Polymerization": 0.20,
    "Gel Polymerization": 0.35,
    "Suspension Polymerization": 0.25,
    "Bulk Polymerization": 0.12,
    "Others (Surface Cross-Linking Process, etc.)": 0.08
  },
  "By Distribution Channel": {
    "Direct": 0.55,
    "Indirect (via Distributors)": 0.45
  }
};

// Hierarchical segment: By End Use Application
const endUseApplication = {
  "Hygiene & Personal Care": {
    share: 0.45,
    children: {
      "Baby Diapers": 0.42,
      "Adult Incontinence Products": 0.30,
      "Feminine Hygiene (Sanitary Napkins)": 0.18,
      "Other Personal Care Products": 0.10
    }
  },
  "Agriculture & Horticulture": {
    share: 0.15,
    children: {
      "Soil Moisture Management": 0.50,
      "Seed Coating": 0.30,
      "Turf & Landscaping": 0.20
    }
  },
  "Industrial Applications": {
    share: 0.18,
    children: {
      "Packaging (e.g., food/fragile goods moisture control)": 0.35,
      "Cable & Wire Filling Gels": 0.35,
      "Desiccants & Drying Agents": 0.30
    }
  },
  "Medical & Healthcare": {
    share: 0.10,
    children: {
      "Surgical Pads": 0.40,
      "Wound Dressings": 0.35,
      "Medical Packaging": 0.25
    }
  },
  "Consumer Goods": {
    share: 0.07,
    children: {
      "Water Absorbent Products (e.g., pet pads)": 0.60,
      "Spill Control": 0.40
    }
  },
  "Others": {
    share: 0.05,
    children: {
      "Construction (crack control in concrete)": 0.55,
      "Textiles": 0.45
    }
  }
};

// Regional base values (USD Million) for 2026 base year - SAP market ~$12B globally
const regionBaseValues = {
  "North America": 2800,
  "Europe": 3200,
  "Asia Pacific": 4500,
  "Latin America": 800,
  "Middle East & Africa": 500
};

const countryShares = {
  "North America": { "U.S.": 0.82, "Canada": 0.18 },
  "Europe": { "U.K.": 0.14, "Germany": 0.22, "Italy": 0.10, "France": 0.15, "Spain": 0.08, "Russia": 0.12, "Rest of Europe": 0.19 },
  "Asia Pacific": { "China": 0.38, "India": 0.18, "Japan": 0.16, "South Korea": 0.10, "ASEAN": 0.08, "Australia": 0.05, "Rest of Asia Pacific": 0.05 },
  "Latin America": { "Brazil": 0.40, "Argentina": 0.15, "Mexico": 0.30, "Rest of Latin America": 0.15 },
  "Middle East & Africa": { "GCC": 0.40, "South Africa": 0.25, "Rest of Middle East & Africa": 0.35 }
};

const regionGrowthRates = {
  "North America": 0.058,
  "Europe": 0.055,
  "Asia Pacific": 0.078,
  "Latin America": 0.068,
  "Middle East & Africa": 0.062
};

// Segment growth multipliers
const segmentGrowthMultipliers = {
  "By Product Type": {
    "Sodium Polyacrylate Based SAP": 0.95,
    "Polyacrylamide / Copolymer SAP": 1.12,
    "Cellulose-based SAP": 1.18,
    "Others (Polyethylene Glycol (PEG) blends, etc.)": 0.88
  },
  "By Physical Form": {
    "Powder": 0.92,
    "Beads / Granules": 1.05,
    "Fibers / Flakes": 1.02,
    "Gel Formulations (Pre-hydrated)": 1.15
  },
  "By Manufacturing Process": {
    "Solution Polymerization": 0.95,
    "Gel Polymerization": 1.10,
    "Suspension Polymerization": 1.02,
    "Bulk Polymerization": 0.88,
    "Others (Surface Cross-Linking Process, etc.)": 0.92
  },
  "By Distribution Channel": {
    "Direct": 0.98,
    "Indirect (via Distributors)": 1.05
  },
  // End use application parents
  "By End Use Application": {
    "Hygiene & Personal Care": 0.96,
    "Agriculture & Horticulture": 1.20,
    "Industrial Applications": 1.08,
    "Medical & Healthcare": 1.25,
    "Consumer Goods": 0.95,
    "Others": 0.88
  },
  // End use application children
  "Hygiene & Personal Care": {
    "Baby Diapers": 0.92,
    "Adult Incontinence Products": 1.15,
    "Feminine Hygiene (Sanitary Napkins)": 0.98,
    "Other Personal Care Products": 0.90
  },
  "Agriculture & Horticulture": {
    "Soil Moisture Management": 1.05,
    "Seed Coating": 0.95,
    "Turf & Landscaping": 0.92
  },
  "Industrial Applications": {
    "Packaging (e.g., food/fragile goods moisture control)": 1.0,
    "Cable & Wire Filling Gels": 1.05,
    "Desiccants & Drying Agents": 0.95
  },
  "Medical & Healthcare": {
    "Surgical Pads": 1.0,
    "Wound Dressings": 1.08,
    "Medical Packaging": 0.95
  },
  "Consumer Goods": {
    "Water Absorbent Products (e.g., pet pads)": 1.02,
    "Spill Control": 0.95
  },
  "Others": {
    "Construction (crack control in concrete)": 1.05,
    "Textiles": 0.92
  }
};

const volumePerMillionUSD = 450;

let seed = 42;
function seededRandom() {
  seed = (seed * 16807 + 0) % 2147483647;
  return (seed - 1) / 2147483646;
}

function addNoise(value, noiseLevel = 0.03) {
  return value * (1 + (seededRandom() - 0.5) * 2 * noiseLevel);
}

function roundTo1(val) { return Math.round(val * 10) / 10; }
function roundToInt(val) { return Math.round(val); }

function generateTimeSeries(baseValue2026, growthRate, roundFn) {
  const series = {};
  for (let i = 0; i < years.length; i++) {
    const yearOffset = i - 5; // 2026 is index 5
    const rawValue = baseValue2026 * Math.pow(1 + growthRate, yearOffset);
    series[years[i]] = roundFn(addNoise(rawValue));
  }
  return series;
}

function generateData(isVolume) {
  const data = {};
  const roundFn = isVolume ? roundToInt : roundTo1;
  const multiplier = isVolume ? volumePerMillionUSD : 1;

  for (const [regionName, countries] of Object.entries(regions)) {
    const regionBase = regionBaseValues[regionName] * multiplier;
    const regionGrowth = regionGrowthRates[regionName];

    // Region-level data
    data[regionName] = {};

    // Flat segments
    for (const [segType, segs] of Object.entries(segmentTypes)) {
      data[regionName][segType] = {};
      for (const [segName, share] of Object.entries(segs)) {
        const segGrowth = regionGrowth * segmentGrowthMultipliers[segType][segName];
        const segBase = regionBase * share;
        data[regionName][segType][segName] = generateTimeSeries(segBase, segGrowth, roundFn);
      }
    }

    // Hierarchical: By End Use Application
    data[regionName]["By End Use Application"] = {};
    for (const [parent, config] of Object.entries(endUseApplication)) {
      const parentBase = regionBase * config.share;
      const parentGrowth = regionGrowth * segmentGrowthMultipliers["By End Use Application"][parent];
      data[regionName]["By End Use Application"][parent] = generateTimeSeries(parentBase, parentGrowth, roundFn);
      for (const [child, childShare] of Object.entries(config.children)) {
        const childBase = parentBase * childShare;
        const childGrowth = parentGrowth * segmentGrowthMultipliers[parent][child];
        data[regionName]["By End Use Application"][child] = generateTimeSeries(childBase, childGrowth, roundFn);
      }
    }

    // By Country
    data[regionName]["By Country"] = {};
    for (const country of countries) {
      const cShare = countryShares[regionName][country];
      const countryGrowthVar = 1 + (seededRandom() - 0.5) * 0.06;
      data[regionName]["By Country"][country] = generateTimeSeries(regionBase * cShare, regionGrowth * countryGrowthVar, roundFn);
    }

    // Country-level data
    for (const country of countries) {
      const cShare = countryShares[regionName][country];
      const countryBase = regionBase * cShare;
      const countryGrowthVar = 1 + (seededRandom() - 0.5) * 0.04;
      const countryGrowth = regionGrowth * countryGrowthVar;

      data[country] = {};

      // Flat segments for country
      for (const [segType, segs] of Object.entries(segmentTypes)) {
        data[country][segType] = {};
        for (const [segName, share] of Object.entries(segs)) {
          const segGrowth = countryGrowth * segmentGrowthMultipliers[segType][segName];
          const segBase = countryBase * share;
          const shareVar = 1 + (seededRandom() - 0.5) * 0.1;
          data[country][segType][segName] = generateTimeSeries(segBase * shareVar, segGrowth, roundFn);
        }
      }

      // Hierarchical: By End Use Application for country
      data[country]["By End Use Application"] = {};
      for (const [parent, config] of Object.entries(endUseApplication)) {
        const parentBase = countryBase * config.share;
        const parentGrowth = countryGrowth * segmentGrowthMultipliers["By End Use Application"][parent];
        const shareVar = 1 + (seededRandom() - 0.5) * 0.1;
        data[country]["By End Use Application"][parent] = generateTimeSeries(parentBase * shareVar, parentGrowth, roundFn);
        for (const [child, childShare] of Object.entries(config.children)) {
          const childBase = parentBase * shareVar * childShare;
          const childGrowth = parentGrowth * segmentGrowthMultipliers[parent][child];
          const childVar = 1 + (seededRandom() - 0.5) * 0.08;
          data[country]["By End Use Application"][child] = generateTimeSeries(childBase * childVar, childGrowth, roundFn);
        }
      }
    }
  }

  return data;
}

// Generate data
seed = 42;
const valueData = generateData(false);
seed = 7777;
const volumeData = generateData(true);

// Generate segmentation_analysis.json
const segAnalysis = {
  "Global": {
    "By Product Type": {},
    "By Physical Form": {},
    "By End Use Application": {},
    "By Manufacturing Process": {},
    "By Distribution Channel": {},
    "By Region": {}
  }
};

for (const item of Object.keys(segmentTypes["By Product Type"])) {
  segAnalysis["Global"]["By Product Type"][item] = {};
}
for (const item of Object.keys(segmentTypes["By Physical Form"])) {
  segAnalysis["Global"]["By Physical Form"][item] = {};
}
for (const item of Object.keys(segmentTypes["By Manufacturing Process"])) {
  segAnalysis["Global"]["By Manufacturing Process"][item] = {};
}
for (const item of Object.keys(segmentTypes["By Distribution Channel"])) {
  segAnalysis["Global"]["By Distribution Channel"][item] = {};
}

// Hierarchical: By End Use Application
for (const [parent, config] of Object.entries(endUseApplication)) {
  segAnalysis["Global"]["By End Use Application"][parent] = {};
  for (const child of Object.keys(config.children)) {
    segAnalysis["Global"]["By End Use Application"][parent][child] = {};
  }
}

// By Region
for (const [region, countries] of Object.entries(regions)) {
  segAnalysis["Global"]["By Region"][region] = {};
  for (const country of countries) {
    segAnalysis["Global"]["By Region"][region][country] = {};
  }
}

// Write files
const outDir = path.join(__dirname, 'public', 'data');
fs.writeFileSync(path.join(outDir, 'segmentation_analysis.json'), JSON.stringify(segAnalysis, null, 2));
fs.writeFileSync(path.join(outDir, 'value.json'), JSON.stringify(valueData, null, 2));
fs.writeFileSync(path.join(outDir, 'volume.json'), JSON.stringify(volumeData, null, 2));

console.log('Generated all data files successfully!');
console.log('Value geographies:', Object.keys(valueData).length);
console.log('Segment types:', Object.keys(valueData['North America']));
console.log('End Use Application segments:', Object.keys(valueData['North America']['By End Use Application']));
console.log('\nSegmentation analysis:');
console.log(JSON.stringify(segAnalysis, null, 2));
