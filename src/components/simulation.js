// src/simulation.js
// Simulation engine: handles state transforms, totals calculation, logs and snapshots.
// Import palette from project root default_palette.js
import { DEFAULT_PALETTE } from "../default_palette";

/*
This module exposes helper functions that operate on data structures used
by the React app. It intentionally keeps logic pure where possible.

Data expectations:
- buildingType: object from DEFAULT_PALETTE (fields are flexible)
- buildingInstance:
  { id, typeId, name, w, h, x, y }

- resources: {
    coins, supplies, goods, alloy, quantumActions,
    population, euphoria,
    coinBoost, suppliesBoost,
    attack, defense
  }

- logs: array of { ts, kind, detail, delta }
- snapshots: { id, name, ts, resources, buildings, logs }
*/

// Helper: flexible field accessor. Searches common column names in type definition.
export function getField(typeObj, candidates = []) {
  for (const c of candidates) {
    if (c in typeObj && typeObj[c] !== null && typeObj[c] !== undefined)
      return typeObj[c];
    // also try case-insensitive variants:
    const keys = Object.keys(typeObj);
    const found = keys.find((k) => k.toLowerCase() === c.toLowerCase());
    if (found) return typeObj[found];
  }
  return 0;
}

// canonical mapping helpers
export function baseProduction(typeObj) {
  return {
    coins:
      Number(
        getField(typeObj, [
          "Produces_Coins",
          "PRODUCES_COINS",
          "ProducesCoins",
          "produces_coins",
        ])
      ) || 0,
    supplies:
      Number(
        getField(typeObj, [
          "Produces_Supplies",
          "PRODUCES_SUPPLIES",
          "ProducesSupplies",
          "produces_supplies",
        ])
      ) || 0,
    alloy:
      Number(
        getField(typeObj, [
          "Produces_Alloy",
          "CHRONO_ALLOY",
          "ProducesAlloy",
          "produces_alloy",
        ])
      ) || 0,
    quantum:
      Number(
        getField(typeObj, [
          "Produces_Quantum_Actions",
          "PRODUCES_QUANTUM_ACTIONS",
          "Produces_Quantum",
        ])
      ) || 0,
  };
}

export function placementEffects(typeObj) {
  return {
    population:
      Number(
        getField(typeObj, [
          "Produces_Population",
          "POPULATION",
          "ProducesPopulation",
        ])
      ) || 0,
    euphoria:
      Number(
        getField(typeObj, ["Produces_Euphoria", "EUPHORIA", "ProducesEuphoria"])
      ) || 0,
    coinBoost:
      Number(
        getField(typeObj, [
          "Produces_Coin_Boost",
          "PRODUCES_COIN_BOOST",
          "ProducesCoinBoost",
        ])
      ) || 0,
    suppliesBoost:
      Number(
        getField(typeObj, [
          "Produces_Supplies_Boost",
          "PRODUCES_SUPPLIES_BOOST",
          "ProducesSuppliesBoost",
        ])
      ) || 0,
    attack:
      Number(
        getField(typeObj, ["Produces_Attack", "ProducesAttack", "ATTACK"])
      ) || 0,
    defense:
      Number(
        getField(typeObj, ["Produces_Defense", "ProducesDefense", "DEFENSE"])
      ) || 0,
  };
}

export function costs(typeObj) {
  return {
    coins:
      Number(getField(typeObj, ["Costs_Coins", "cost_coins", "CostsCoins"])) ||
      0,
    supplies:
      Number(
        getField(typeObj, ["Costs_Supplies", "cost_supplies", "CostsSupplies"])
      ) || 0,
    alloy:
      Number(getField(typeObj, ["Costs_Alloy", "cost_alloy", "CostsAlloy"])) ||
      0,
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
    const t = allTypes[inst.typeId] || inst; // inst might contain inline fields
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
  // deduct costs and apply placement effects
  const c = costs(buildingType);
  resources.coins -= c.coins;
  resources.supplies -= c.supplies;
  resources.alloy -= c.alloy;

  const pe = placementEffects(buildingType);
  resources.population += pe.population;
  resources.euphoria += pe.euphoria;
  resources.coinBoost += pe.coinBoost;
  resources.suppliesBoost += pe.suppliesBoost;
  resources.attack += pe.attack;
  resources.defense += pe.defense;

  return {
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
  // computes final yields and applies them to resources.
  // accepts optionally precomputed aggregates to reuse multiplier logic
  const bp = baseProduction(buildingType);
  // if aggregates provided, use those multipliers; else compute single building multiplier
  let eupMultiplier = 1;
  let coinBoost = 0,
    suppliesBoost = 0;
  if (aggregates) {
    eupMultiplier = aggregates.eupMultiplier;
    coinBoost = aggregates.COINBOOST;
    suppliesBoost = aggregates.SUPPLIESBOOST;
  } else {
    // single building context: treat boost as only from this building placements (rare)
    const pe = placementEffects(buildingType);
    eupMultiplier = getEuphoriaMultiplier(
      pe.euphoria && pe.population
        ? Math.round((pe.euphoria / pe.population) * 100)
        : 100
    );
    coinBoost = pe.coinBoost;
    suppliesBoost = pe.suppliesBoost;
  }

  const coinsGain = Math.round(bp.coins * (eupMultiplier + coinBoost));
  const suppliesGain = Math.round(
    bp.supplies * (eupMultiplier + suppliesBoost)
  );
  const alloyGain = Math.round(bp.alloy * eupMultiplier);
  const quantumGain = Math.round(bp.quantum);

  resources.coins += coinsGain;
  resources.supplies += suppliesGain;
  resources.alloy += alloyGain;
  resources.quantumActions = (resources.quantumActions || 0) + quantumGain;

  return {
    delta: {
      coins: coinsGain,
      supplies: suppliesGain,
      alloy: alloyGain,
      quantum: quantumGain,
    },
  };
}

export function applySell(resources, buildingType, c = null) {
  // apply collect first (we assume selling includes last collect)
  const collectResult = applyCollect(resources, buildingType);
  // apply refund of 25% of cost
  const cost = costs(buildingType);
  const refundCoins = Math.round(0.25 * (cost.coins || 0));
  const refundSupplies = Math.round(0.25 * (cost.supplies || 0));
  const refundAlloy = Math.round(0.25 * (cost.alloy || 0));
  resources.coins += refundCoins;
  resources.supplies += refundSupplies;
  resources.alloy += refundAlloy;

  return {
    delta: {
      ...collectResult.delta,
      refundCoins,
      refundSupplies,
      refundAlloy,
    },
  };
}
