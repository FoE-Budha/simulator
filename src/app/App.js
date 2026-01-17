import React, { useState, useMemo } from "react";
import { uuid, createActionLog, mergeLog, isBuildingReady } from "../utils";
import PalettePanel from "../components/palette/PalettePanel";
import MapPanel from "../components/MapPanel";
import StatsPanel from "../components/stats/StatsPanel";
import ChunkDialog from "../components/dialogs/ChunkDialog";
import BuildingDialog from "../components/dialogs/BuildingDialog";
import ResourcesDialog from "../components/dialogs/ResourcesDialog";

import * as sim from "../simulation/simulation";
import { DEFAULT_PALETTE } from "../data/default_palette";

// -----------------------------
// INITIAL STATE
// -----------------------------

const initialResources = {
  coins: 450000,
  supplies: 75000,
  goods: 20,
  alloy: 0,
  shards: 500,
  quantumActions: 0,
  population: 0,
  euphoria: 0,
  coinBoost: 0,
  suppliesBoost: 0,
  attack: 0,
  defense: 0,
};

// Helper function to create default Town Hall using ONLY palette data
const getBuildingTypeFromPalette = (typeId) => {
  for (const groupKey in DEFAULT_PALETTE) {
    const group = DEFAULT_PALETTE[groupKey];
    if (Array.isArray(group)) {
      const found = group.find((type) => type.id === typeId);
      if (found) return found;
    }
  }
  return null;
};

const createDefaultTownHall = () => {
  const townHallType = getBuildingTypeFromPalette("town hall_1764107877");

  if (!townHallType) {
    console.error("Town Hall not found in DEFAULT_PALETTE");
    return null;
  }

  // Convert milliseconds to hours
  const buildHoursNeeded = (townHallType.buildTime || 0) / 3600000;
  const productionHoursNeeded = (townHallType.productionTime || 0) / 3600000;

  return {
    id: uuid("b_"),
    typeId: townHallType.id,
    name: townHallType.name,
    w: townHallType.w,
    h: townHallType.h,
    x: 17,
    y: 4,

    // Time properties
    buildHoursNeeded: buildHoursNeeded,
    productionHoursNeeded: productionHoursNeeded,
    hoursBuilt: buildHoursNeeded, // Already fully built
    hoursProduced: 0,
  };
};

// -----------------------------
// APP
// -----------------------------

export default function App() {
  // core state
  const [resources, setResources] = useState(initialResources);
  const [paletteGroups, setPaletteGroups] = useState(DEFAULT_PALETTE);
  const [buildings, setBuildings] = useState(() => {
    const townHall = createDefaultTownHall();
    return townHall ? [townHall] : [];
  });
  const [chunksMap, setChunksMap] = useState({});
  const [selectedType, setSelectedType] = useState(null);
  const [gameTime, setGameTime] = useState(0);

  // ui state
  const [chunkDialog, setChunkDialog] = useState(null);
  const [logs, setLogs] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [lastCompare, setLastCompare] = useState(null);
  const [buildingDialog, setBuildingDialog] = useState(null);
  const [resourcesDialog, setResourcesDialog] = useState(false);
  const [unlockCounts, setUnlockCounts] = useState({ shards: 0, goods: 0 });

  // -----------------------------
  // DERIVED DATA
  // -----------------------------

  const aggregates = useMemo(
    () => sim.computeAggregates(buildings, paletteGroups),
    [buildings, paletteGroups]
  );

  // -----------------------------
  // HELPER FUNCTIONS
  // -----------------------------

  const getBuildingTypeFromPalette = (typeId) => {
    for (const groupKey in paletteGroups) {
      const group = paletteGroups[groupKey];
      if (Array.isArray(group)) {
        const found = group.find((type) => type.id === typeId);
        if (found) return found;
      }
    }
    return null;
  };

  // -----------------------------
  // TIME MANAGEMENT FUNCTIONS
  // -----------------------------

  /**
   * Skip forward in time by specified hours
   * Updates all buildings' construction and production progress
   */
  const skipTime = (hours) => {
    if (hours <= 0) return;

    // Update game time
    setGameTime((prev) => prev + hours);

    // Update all buildings' progress
    setBuildings((prev) =>
      prev.map((building) => {
        const newBuilding = { ...building };

        // 1. Advance construction progress
        if (building.hoursBuilt < building.buildHoursNeeded) {
          const hoursBuilt = Math.min(
            building.hoursBuilt + hours,
            building.buildHoursNeeded
          );
          newBuilding.hoursBuilt = hoursBuilt;

          // Check if construction just completed
          if (
            hoursBuilt >= building.buildHoursNeeded &&
            building.hoursBuilt < building.buildHoursNeeded
          ) {
            // Building just finished construction
            console.log(`${building.name} construction completed!`);
          }
        }

        // 2. Advance production progress (only if construction is complete)
        if (building.hoursBuilt >= building.buildHoursNeeded) {
          const currentProduced = building.hoursProduced || 0;
          newBuilding.hoursProduced = currentProduced + hours;
        }

        return newBuilding;
      })
    );

    // Add time skip log
    const log = createActionLog(
      "time",
      `Wait for ${hours} hours`,
      resources,
      {},
      { hours: hours, newGameTime: gameTime + hours }
    );
    setLogs((prev) => mergeLog(log, prev));
  };

  // -----------------------------
  // CORE ACTIONS
  // -----------------------------

  /**
   * Place building
   */
  const handlePlaceBuilding = (x, y) => {
    if (!selectedType) return;

    const required = sim.costs(selectedType);
    const populationEffect = selectedType.population;

    // Check each resource individually to provide specific feedback
    let missingResources = [];

    if (resources.coins < required.coins) {
      missingResources.push(`${required.coins - resources.coins} coins`);
    }
    if (resources.supplies < required.supplies) {
      missingResources.push(
        `${required.supplies - resources.supplies} supplies`
      );
    }
    if (resources.alloy < required.alloy) {
      missingResources.push(`${required.alloy - resources.alloy} alloy`);
    }
    // Check if building consumes population and we don't have enough
    if (populationEffect < 0) {
      // Negative means it consumes population
      const populationRequired = Math.abs(populationEffect);
      if (resources.population < populationRequired) {
        missingResources.push(
          `${populationRequired - resources.population} population`
        );
      }
    }

    // If any resources are missing, show alert and stop
    if (missingResources.length > 0) {
      alert(
        `Cannot build ${selectedType.name}\n\nMissing:\n${missingResources.join(
          "\n"
        )}`
      );
      return;
    }

    // If we get here, build is successful
    const result = sim.applyBuild(resources, selectedType);
    if (!result) return;

    // Convert milliseconds to hours for our time system
    const buildHoursNeeded = (selectedType.buildTime || 0) / 3600000;
    const productionHoursNeeded = (selectedType.productionTime || 0) / 3600000;

    // Create building with time properties
    const newBuilding = {
      id: uuid("b_"),
      typeId: selectedType.id,
      name: selectedType.name,
      w: selectedType.w,
      h: selectedType.h,
      x,
      y,

      // Time properties (in HOURS)
      buildHoursNeeded: buildHoursNeeded,
      productionHoursNeeded: productionHoursNeeded,
      hoursBuilt: 0, // How many hours already built
      hoursProduced: 0, // How many hours since last collection
    };

    const log = createActionLog(
      "build",
      `Built ${selectedType.name}`,
      result.resources,
      result.delta,
      {
        coordinates: { x, y },
        buildTime: buildHoursNeeded,
        productionTime: productionHoursNeeded,
      }
    );

    // Update state
    setResources(result.resources);
    setBuildings((prev) => [...prev, newBuilding]);
    setLogs((prev) => mergeLog(log, prev));
  };

  /**
   * Move building
   */
  const handleMoveBuilding = (buildingId, newX, newY) => {
    setBuildings((prev) =>
      prev.map((building) => {
        if (building.id === buildingId) {
          const log = createActionLog(
            "move",
            `Moved ${building.name}`,
            resources,
            {},
            {
              from: { x: building.x, y: building.y },
              to: { x: newX, y: newY },
            }
          );
          setLogs((prev) => mergeLog(log, prev));

          return {
            ...building,
            x: newX,
            y: newY,
          };
        }
        return building;
      })
    );
  };

  const handleCollect = (building) => {
    const buildingType = getBuildingTypeFromPalette(building.typeId);
    if (!buildingType) return;

    // 1. Check if building is fully constructed
    if (!isBuildingReady(building)) {
      alert(`🚧 ${building.name} is not ready for collection!`);
      return;
    }

    // 3. Get collection result
    const result = sim.applyCollect(resources, buildingType, aggregates);
    if (!result) return;

    // 4. Reset production counter for this building
    setBuildings((prev) =>
      prev.map((b) => (b.id === building.id ? { ...b, hoursProduced: 0 } : b))
    );

    // 5. Update resources and log
    setResources(result.resources);
    const log = createActionLog(
      "collect",
      `Collected from ${building.name}`,
      result.resources,
      result.delta,
      { building: building.name }
    );
    setLogs((prev) => mergeLog(log, prev));

    // 3. Update state
    setResources(result.resources);
  };

  /**
   * Sell building & Collect if ready
   */
  const handleSell = (building) => {
    const buildingType = getBuildingTypeFromPalette(building.typeId);
    if (!buildingType || building.typeId === "town hall_1764107877") return;

    // Check if selling would drop population below 0
    const populationEffect = buildingType.population || 0;

    // If this building provides population (positive effect),
    // check if removing it would drop below zero
    if (populationEffect > 0) {
      const newPopulation = resources.population - populationEffect;
      if (newPopulation < 0) {
        alert(
          `Cannot sell ${buildingType.name}!\n\n` +
            `This building provides ${populationEffect} population.\n` +
            `Selling it would reduce your population to ${newPopulation}.\n` +
            `You must have at least 0 population.`
        );
        return;
      }
    }

    // 1. FIRST get the result
    const result = sim.applySell(resources, buildingType, aggregates, {
      hoursBuilt: building.hoursBuilt,
      buildHoursNeeded: building.buildHoursNeeded,
      hoursProduced: building.hoursProduced,
      productionHoursNeeded: building.productionHoursNeeded,
    });

    if (!result) return;

    // 2. Create log
    const log = createActionLog(
      "sell",
      `Sold ${building.name}`,
      result.resources,
      result.delta,
      { building: building.name }
    );

    // Update state
    setResources(result.resources);
    setBuildings((b) => b.filter((x) => x.id !== building.id));
    setLogs((prev) => mergeLog(log, prev));
  };

  /**
   * SPEED UP WITH Shards
   */
  const handleSpeedUpBuilding = (building) => {
    // 1. Get building type
    const buildingType = getBuildingTypeFromPalette(building.typeId);
    if (!buildingType) {
      console.log("Building type not found");
      return;
    }

    // 2. Extract tier from "T1", "T2", "T3", etc.
    const tierStr = buildingType.tier || "T1";
    const tier = parseInt(tierStr.substring(1), 10) || 1;

    console.log(`Speed up: ${building.name}, Tier: T${tier} (raw: ${tierStr})`);

    // 3. Check building status and calculate cost
    let shardCost = 0;
    let hoursToAdd = 0;
    let actionType = "";

    if (building.hoursBuilt < building.buildHoursNeeded) {
      // CONSTRUCTION speed-up
      actionType = "construction";

      if (tier === 2) {
        shardCost = 25;
        hoursToAdd = 1;
      } else if (tier === 3) {
        shardCost = 50;
        hoursToAdd = 10;
      } else {
        // T1 or other tiers
        shardCost = 10;
        hoursToAdd = 0; // T1 cannot be sped up
      }
    } else if (building.hoursProduced < building.productionHoursNeeded) {
      // PRODUCTION speed-up
      actionType = "production";

      if (tier === 2) {
        shardCost = 75;
        hoursToAdd = 10;
      } else if (tier === 3) {
        shardCost = 95;
        hoursToAdd = 10;
      } else {
        // T1 or other tiers
        shardCost = 50;
        hoursToAdd = 10;
      }
    } else {
      alert(`🏗️ ${building.name} is already ready to collect!`);
      return;
    }

    // 5. Check shards
    if (resources.shards < shardCost) {
      alert(
        `❌ Not enough shards!\nNeed: ${shardCost}\nHave: ${resources.shards}`
      );
      return;
    }

    // 6. Confirm
    const confirmMessage = `Speed up ${building.name} (T${tier}) ${actionType} by ${hoursToAdd} hours?\n\nCost: ${shardCost} shards`;

    if (!window.confirm(confirmMessage)) return;

    // 7. Apply speed-up
    let newHoursBuilt = building.hoursBuilt;
    let newHoursProduced = building.hoursProduced;

    if (actionType === "construction") {
      newHoursBuilt = Math.min(
        building.hoursBuilt + hoursToAdd,
        building.buildHoursNeeded
      );
    } else {
      newHoursProduced = Math.min(
        building.hoursProduced + hoursToAdd,
        building.productionHoursNeeded
      );
    }

    // 8. Update state
    setBuildings((prev) =>
      prev.map((b) =>
        b.id === building.id
          ? { ...b, hoursBuilt: newHoursBuilt, hoursProduced: newHoursProduced }
          : b
      )
    );

    setResources((prev) => ({
      ...prev,
      shards: prev.shards - shardCost,
    }));

    // 9. Log
    const log = createActionLog(
      "speedup",
      `Sped up ${building.name} ${actionType}`,
      { ...resources, shards: resources.shards - shardCost },
      { shards: -shardCost },
      {
        building: building.name,
        tier,
        hoursAdded: hoursToAdd,
        actionType,
        shardCost,
      }
    );
    setLogs((prev) => mergeLog(log, prev));

    // 10. Success message
    alert(
      `✅ ${
        building.name
      } ${actionType} sped up by ${hoursToAdd} hours!\nShards remaining: ${
        resources.shards - shardCost
      }`
    );
  };

  /**
   * Collect from all buildings that are ready
   */
  const collectAllReady = () => {
    let totalYield = {
      coins: 0,
      supplies: 0,
      alloy: 0,
      shards: 0,
      goods: 0,
      quantum: 0,
    };
    let collectedCount = 0;
    let updatedResources = { ...resources };

    // Find all ready buildings first
    const readyBuildings = buildings.filter((building) => {
      if (!isBuildingReady(building)) return false;

      const buildingType = getBuildingTypeFromPalette(building.typeId);
      return !!buildingType; // Also check if type exists
    });

    if (readyBuildings.length === 0) {
      alert("No buildings ready to collect from!");
      return 0;
    }

    // Collect from all ready buildings
    readyBuildings.forEach((building) => {
      const buildingType = getBuildingTypeFromPalette(building.typeId);
      if (!buildingType) return;

      const result = sim.applyCollect(
        updatedResources,
        buildingType,
        aggregates
      );

      if (result) {
        // Add to totals
        Object.keys(totalYield).forEach((key) => {
          totalYield[key] += result.delta[key] || 0;
        });

        updatedResources = result.resources;
        collectedCount++;
      }
    });

    // Update state once
    setResources(updatedResources);

    // Reset production counters
    setBuildings((prev) =>
      prev.map((building) => {
        if (isBuildingReady(building)) {
          return { ...building, hoursProduced: 0 };
        }
        return building;
      })
    );

    // Add log
    const log = createActionLog(
      "collect",
      `Collected from ${collectedCount} buildings`,
      updatedResources,
      totalYield,
      { count: collectedCount }
    );
    setLogs((prev) => mergeLog(log, prev));

    return collectedCount;
  };

  // -----------------------------
  // Expansion unlock
  // -----------------------------

  const handleChunkClick = (chunk) => {
    setChunkDialog(chunk);
  };

  const handleUnlockChunk = (chunkKey, unlockData) => {
    const { type, amount } = unlockData;

    // Check resources
    if (type === "shards" && resources.shards < amount) {
      alert(`Need ${amount} shards, only have ${resources.shards}`);
      return;
    }

    if (type === "goods" && resources.goods < amount) {
      alert(`Need ${amount} goods, only have ${resources.goods}`);
      return;
    }

    // Update global unlock counter for this type
    setUnlockCounts((prev) => ({
      ...prev,
      [type]: prev[type] + 1,
    }));

    // Update resources
    setResources((prev) => ({
      ...prev,
      [type]: prev[type] - amount,
    }));

    // Update chunk state
    setChunksMap((prev) => ({
      ...prev,
      [chunkKey]: {
        ...prev[chunkKey],
        state: "available",
      },
    }));

    // Add log
    const log = createActionLog(
      "unlock",
      `Unlocked expansion with ${type}`,
      { ...resources, [type]: resources[type] - amount },
      { [type]: -amount },
      {
        chunk: chunkKey,
        unlockNumber: unlockCounts[type] + 1,
      }
    );
    setLogs((prev) => mergeLog(log, prev));

    setChunkDialog(null);
  };

  const saveSnapshot = (name) => {
    setSnapshots((s) => [
      ...s,
      {
        id: uuid("snap_"),
        name: name || `Snapshot ${s.length + 1}`,
        resources,
        buildings,
        logs,
        gameTime, // Include game time in snapshots
      },
    ]);
  };

  const compareSnapshot = (snapId) => {
    const snap = snapshots.find((s) => s.id === snapId);
    if (!snap) return;

    setLastCompare({
      snap,
      diff: {
        coins: resources.coins - snap.resources.coins,
        supplies: resources.supplies - snap.resources.supplies,
        goods: resources.goods - snap.resources.goods,
        alloy: resources.alloy - snap.resources.alloy,
        population: resources.population - snap.resources.population,
        gameTime: gameTime - (snap.gameTime || 0),
      },
    });
  };

  const handleUpdateResources = (newResources) => {
    setResources((prev) => ({
      ...prev,
      ...newResources,
    }));

    const log = createActionLog(
      "resources",
      "Updated resources",
      { ...resources, ...newResources },
      {},
      { action: "manual_update" }
    );
    setLogs((prev) => mergeLog(log, prev));
  };

  // -----------------------------
  // Building Menu
  // -----------------------------

  const handleCreateBuilding = () => {
    setBuildingDialog({ building: null });
  };

  const handleEditBuilding = (building) => {
    setBuildingDialog({ building });
  };

  const handleSaveBuilding = (buildingData, group) => {
    if (buildingDialog?.building) {
      // Edit existing building
      setPaletteGroups((prev) => {
        const newGroups = { ...prev };

        // Remove from old group
        Object.keys(newGroups).forEach((groupKey) => {
          newGroups[groupKey] = newGroups[groupKey].filter(
            (b) => b.id !== buildingData.id
          );
        });

        // Add to new group
        if (!newGroups[group]) {
          newGroups[group] = [];
        }
        newGroups[group].push(buildingData);

        return newGroups;
      });
    } else {
      // Add new building
      setPaletteGroups((prev) => {
        const newGroups = { ...prev };
        if (!newGroups[group]) {
          newGroups[group] = [];
        }
        newGroups[group].push(buildingData);
        return newGroups;
      });
    }

    setBuildingDialog(null);
  };

  const handleCloseBuildingDialog = () => {
    setBuildingDialog(null);
  };

  // -----------------------------
  // Calculate ready buildings count (for UI display)
  // -----------------------------
  const readyToCollectCount = useMemo(() => {
    return buildings.filter((building) => {
      const isConstructed = building.hoursBuilt >= building.buildHoursNeeded;
      const isProductionReady =
        building.hoursProduced >= building.productionHoursNeeded;
      return isConstructed && isProductionReady;
    }).length;
  }, [buildings]);

  // -----------------------------
  // RENDER
  // -----------------------------

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <PalettePanel
        paletteGroups={paletteGroups}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        onEdit={handleEditBuilding}
        onCreate={handleCreateBuilding}
      />

      <MapPanel
        chunksMap={chunksMap}
        buildings={buildings}
        selectedType={selectedType}
        onPlace={handlePlaceBuilding}
        onChunkClick={handleChunkClick}
        onCollect={handleCollect}
        onSell={handleSell}
        onMove={handleMoveBuilding}
        setChunksMap={setChunksMap}
        gameTime={gameTime}
        skipTime={skipTime}
        collectAllReady={collectAllReady}
        readyToCollectCount={readyToCollectCount}
        speedUpWithShards={handleSpeedUpBuilding}
      />

      <StatsPanel
        resources={resources}
        aggregates={aggregates}
        logs={logs}
        snapshots={snapshots}
        lastCompare={lastCompare}
        saveSnapshot={saveSnapshot}
        compareSnapshot={compareSnapshot}
        onOpenResourcesDialog={() => setResourcesDialog(true)}
        // NEW: Pass time-related props
        gameTime={gameTime}
        skipTime={skipTime}
        collectAllReady={collectAllReady}
        readyToCollectCount={readyToCollectCount}
      />

      {chunkDialog && (
        <ChunkDialog
          chunk={chunkDialog}
          unlockCounts={unlockCounts}
          onClose={() => setChunkDialog(null)}
          onUnlock={handleUnlockChunk}
        />
      )}

      {buildingDialog && (
        <BuildingDialog
          building={buildingDialog.building}
          onSave={handleSaveBuilding}
          onClose={handleCloseBuildingDialog}
          paletteGroups={paletteGroups}
        />
      )}

      {resourcesDialog && (
        <ResourcesDialog
          resources={resources}
          onSave={handleUpdateResources}
          onClose={() => setResourcesDialog(false)}
        />
      )}
    </div>
  );
}
