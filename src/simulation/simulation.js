// Simulation engine: handles state transforms, totals calculation, logs and snapshots.
import { DEFAULT_PALETTE } from "../data/default_palette";

export function costs(typeObj) {
  return {
    coins: typeObj.cost_coins || 0,
    supplies: typeObj.cost_supplies || 0,
    alloy: typeObj.cost_alloy || 0,
  };
}

export function baseProduction(typeObj) {
  return {
    coins: typeObj.produces_coins || 0,
    supplies: typeObj.produces_supplies || 0,
    alloy: typeObj.produces_alloy || 0,
    quantum: typeObj.produces_quantum || 0,
  };
}

export function placementEffects(typeObj) {
  return {
    population: typeObj.population || 0,
    euphoria: typeObj.euphoria || 0,
    coinBoost: typeObj.coin_boost || 0,
    suppliesBoost: typeObj.supplies_boost || 0,
    attack: typeObj.attack || 0,
    defense: typeObj.defense || 0,
    quantumActions: typeObj.quantum_actions || 0,
  };
}

// Euphoria multiplier function (per table)
export function getEuphoriaMultiplier(ratioPercent) {
  if (ratioPercent <= 20) return 0.2;
  if (ratioPercent <= 60) return 0.6;
  if (ratioPercent <= 80) return 0.8;
  if (ratioPercent <= 120) return 1.0;
  if (ratioPercent <= 140) return 1.1;
  if (ratioPercent <= 199) return 1.2;
  return 1.5;
}

// Compute aggregates from placed buildings and buildingTypes
export function computeAggregates(buildingInstances, paletteGroups) {
  // palette flatten
  const allTypes = {};
  Object.keys(paletteGroups || DEFAULT_PALETTE).forEach((g) => {
    (paletteGroups?.[g] || DEFAULT_PALETTE[g] || []).forEach((t) => {
      allTypes[t.id] = t;
    });
  });
  // Totals
  let POPULATION = 0,
    EUPHORIA = 0,
    COINBOOST = 0,
    SUPPLIESBOOST = 0,
    ATTACK = 0,
    DEFENSE = 0;
  let baseCoins = 0,
    baseSupplies = 0,
    baseAlloy = 0,
    baseQuantum = 0;
  buildingInstances.forEach((inst) => {
    const t = allTypes[inst.typeId] || inst;
    const pe = placementEffects(t);
    POPULATION += pe.population;
    EUPHORIA += pe.euphoria;
    COINBOOST += pe.coinBoost;
    SUPPLIESBOOST += pe.suppliesBoost;
    ATTACK += pe.attack;
    DEFENSE += pe.defense;
    const bp = baseProduction(t);
    baseCoins += bp.coins;
    baseSupplies += bp.supplies;
    baseAlloy += bp.alloy;
    baseQuantum += bp.quantum;
  });

  const euphRatio =
    POPULATION > 0 ? Math.round((EUPHORIA / POPULATION) * 100) : 100;
  const eupMultiplier = getEuphoriaMultiplier(euphRatio);

  // Final production after applying the rule:
  // coins_final = baseCoins * (eupMultiplier + coinBoost)
  // supplies_final = baseSupplies * (eupMultiplier + suppliesBoost)
  const finalCoins = Math.round(baseCoins * (eupMultiplier + COINBOOST));
  const finalSupplies = Math.round(
    baseSupplies * (eupMultiplier + SUPPLIESBOOST)
  );
  const finalAlloy = Math.round(baseAlloy * eupMultiplier);
  const finalQuantum = Math.round(baseQuantum);

  return {
    POPULATION,
    EUPHORIA,
    euphRatio,
    eupMultiplier,
    COINBOOST,
    SUPPLIESBOOST,
    ATTACK,
    DEFENSE,
    baseCoins,
    baseSupplies,
    baseAlloy,
    baseQuantum,
    finalCoins,
    finalSupplies,
    finalAlloy,
    finalQuantum,
  };
}

// Build / collect / sell event helpers

export function applyBuild(resources, buildingType) {
  // Create a NEW resources object
  const newResources = { ...resources };

  const c = costs(buildingType);
  newResources.coins -= c.coins;
  newResources.supplies -= c.supplies;
  newResources.alloy -= c.alloy;

  const pe = placementEffects(buildingType);
  newResources.population += pe.population;
  newResources.euphoria += pe.euphoria;
  newResources.coinBoost += pe.coinBoost;
  newResources.suppliesBoost += pe.suppliesBoost;
  newResources.attack += pe.attack;
  newResources.defense += pe.defense;

  // Return BOTH the new resources AND the delta
  return {
    resources: newResources,
    delta: {
      coins: -c.coins,
      supplies: -c.supplies,
      alloy: -c.alloy,
      population: pe.population,
      euphoria: pe.euphoria,
      coinBoost: pe.coinBoost,
      suppliesBoost: pe.suppliesBoost,
      attack: pe.attack,
      defense: pe.defense,
    },
  };
}

export function applyCollect(resources, buildingType, aggregates = null) {
  const newResources = { ...resources };


  // Town Hall - use fixed values
  if (buildingType.id === "town hall_1764107877") {
    const coinsGain = buildingType.produces_coins || 0;
    const suppliesGain = buildingType.produces_supplies || 0;
    const alloyGain = buildingType.produces_alloy || 0;
    
    newResources.coins += coinsGain;
    newResources.supplies += suppliesGain;
    newResources.alloy += alloyGain;
    
    return {
      resources: newResources,
      delta: {
        coins: coinsGain,
        supplies: suppliesGain,
        alloy: alloyGain,
        quantum: 0,
      },
    };
  }

  const bp = baseProduction(buildingType);
  console.log("Base production:", bp);

  let eupMultiplier = 1;
  let coinBoost = 0,
    suppliesBoost = 0;

  if (aggregates) {
    console.log("Using AGGREGATES for calculation");
    eupMultiplier = aggregates.eupMultiplier;
    coinBoost = aggregates.COINBOOST;
    suppliesBoost = aggregates.SUPPLIESBOOST;
  } else {
    console.log("FALLING BACK to individual building calculation");
    const pe = placementEffects(buildingType);
    console.log("Placement effects:", pe);
    const ratio =
      pe.population > 0 ? Math.round((pe.euphoria / pe.population) * 100) : 100;
    eupMultiplier = getEuphoriaMultiplier(ratio);
    coinBoost = pe.coinBoost;
    suppliesBoost = pe.suppliesBoost;
  }

  console.log(
    "Final multipliers - eupMultiplier:",
    eupMultiplier,
    "coinBoost:",
    coinBoost,
    "suppliesBoost:",
    suppliesBoost
  );

  const coinsGain = Math.round(bp.coins * (eupMultiplier + coinBoost));
  const suppliesGain = Math.round(
    bp.supplies * (eupMultiplier + suppliesBoost)
  );
  const alloyGain = Math.round(bp.alloy * eupMultiplier);
  const quantumGain = Math.round(bp.quantum || 0);

  console.log(
    "Gains - coins:",
    coinsGain,
    "supplies:",
    suppliesGain,
    "alloy:",
    alloyGain
  );

  newResources.coins += coinsGain;
  newResources.supplies += suppliesGain;
  newResources.alloy += alloyGain;
  newResources.quantumActions =
    (newResources.quantumActions || 0) + quantumGain;

  return {
    resources: newResources,
    delta: {
      coins: coinsGain,
      supplies: suppliesGain,
      alloy: alloyGain,
      quantum: quantumGain,
    },
  };
}

export function applySell(resources, buildingType, aggregates = null, buildingStatus = null) {
  const newResources = { ...resources };

  let collectionDelta = { coins: 0, supplies: 0, alloy: 0, quantum: 0 };
  
  // Check if building is ready to collect
  const isReady = buildingStatus && 
                  buildingStatus.hoursBuilt >= buildingStatus.buildHoursNeeded && 
                  buildingStatus.hoursProduced >= buildingStatus.productionHoursNeeded;

  // Only collect if the building is ready
  if (isReady) {
    const collectResult = applyCollect(newResources, buildingType, aggregates);
    if (collectResult) {
      Object.assign(newResources, collectResult.resources);
      collectionDelta = collectResult.delta;  // Store collection yields
    }
  }

  // Apply refund (25% of construction costs)
  const cost = costs(buildingType);
  const refundCoins = Math.round(0.25 * (cost.coins || 0));
  const refundSupplies = Math.round(0.25 * (cost.supplies || 0));
  const refundAlloy = Math.round(0.25 * (cost.alloy || 0));

  newResources.coins += refundCoins;
  newResources.supplies += refundSupplies;
  newResources.alloy += refundAlloy;

  // Remove placement effects
  const pe = placementEffects(buildingType);
  newResources.population -= pe.population;
  newResources.euphoria -= pe.euphoria;
  newResources.coinBoost -= pe.coinBoost;
  newResources.suppliesBoost -= pe.suppliesBoost;
  newResources.attack -= pe.attack;
  newResources.defense -= pe.defense;

  // Return result 
  return {
    resources: newResources,
    delta: {
      coins: collectionDelta.coins,
      supplies: collectionDelta.supplies,
      alloy: collectionDelta.alloy,
      quantum: collectionDelta.quantum,
      refundCoins,
      refundSupplies,
      refundAlloy,
      population: -pe.population,
      euphoria: -pe.euphoria,
      coinBoost: -pe.coinBoost,
      suppliesBoost: -pe.suppliesBoost,
      attack: -pe.attack,
      defense: -pe.defense,
    }
  };
}