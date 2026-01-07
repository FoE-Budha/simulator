import React, { useState, useMemo } from "react";
import { uuid, createActionLog, mergeLog } from "../utils";
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

// -----------------------------
// APP
// -----------------------------

export default function App() {
  // core state
  const [resources, setResources] = useState(initialResources);
  const [paletteGroups, setPaletteGroups] = useState(DEFAULT_PALETTE);
  const [buildings, setBuildings] = useState([]);
  const [chunksMap, setChunksMap] = useState({});
  const [selectedType, setSelectedType] = useState(null);

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
  // CORE ACTIONS
  // -----------------------------

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

    const log = createActionLog(
      "build",
      `Built ${selectedType.name}`,
      result.resources,
      result.delta,
      { coordinates: { x, y } }
    );
    setLogs((prev) => mergeLog(log, prev));

    setResources(result.resources);

    setBuildings((prev) => [
      ...prev,
      {
        id: uuid("b_"),
        typeId: selectedType.id,
        name: selectedType.name,
        w: selectedType.w,
        h: selectedType.h,
        x,
        y,
      },
    ]);
  };

  // Add move handler
  const handleMoveBuilding = (buildingId, newX, newY) => {
    setBuildings((prev) =>
      prev.map((building) => {
        if (building.id === buildingId) {
          // Create a log for the move
          const log = createActionLog(
            "move",
            `Moved ${building.name}`,
            resources,
            {}, // No delta for move
            { from: { x: building.x, y: building.y }, to: { x: newX, y: newY } }
          );
          setLogs((prev) => mergeLog(log, prev));

          // Update building position
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

    // 1. FIRST get the result
    const result = sim.applyCollect(resources, buildingType, aggregates);
    if (!result) return;

    // 2. THEN create log
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
    const result = sim.applySell(resources, buildingType);
    if (!result) return;

    // 2. THEN create log
    const log = createActionLog(
      "sell",
      `Sold ${building.name}`,
      result.resources,
      result.delta,
      { building: building.name }
    );
    setLogs((prev) => mergeLog(log, prev));

    // 3. Update state
    setResources(result.resources);
    setBuildings((b) => b.filter((x) => x.id !== building.id));
  };

  // -----------------------------
  // Expansion unlock
  // -----------------------------

  const handleChunkClick = (chunk) => {
    setChunkDialog(chunk);
  };

  // Chunk unlocking with global counters
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

    // Update GLOBAL unlock counter
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
      { [type]: -amount }, // Negative delta (cost)
      { chunk: chunkKey, unlockNumber: unlockCounts[type] + 1 }
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
      },
    });
  };

  // Manual resource update handler
  const handleUpdateResources = (newResources) => {
    setResources((prev) => ({
      ...prev,
      ...newResources,
    }));

    const log = createActionLog(
      "resources",
      "Updated resources",
      { ...resources, ...newResources },
      {}, // No delta shown for manual updates
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
