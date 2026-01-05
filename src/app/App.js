import React, { useState, useMemo } from "react";
import { uuid } from "../utils";

import PalettePanel from "../components/palette/PalettePanel";
import MapPanel from "../components/MapPanel";
import StatsPanel from "../components/stats/StatsPanel";
import ChunkDialog from "../components/dialogs/ChunkDialog";
import BuildingDialog from "../components/dialogs/BuildingDialog";

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
  shards: 0,
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

    const log = {
      id: uuid("log_"),
      type: "build",
      message: `Built ${selectedType.name}`,
      resources: result.resources,
      details: {
        building: selectedType.name,
        cost: result.delta,
        coordinates: { x, y }, // Important for merging same-building placements
      },
    };
    addLog(log);

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
          const log = {
            id: uuid("log_"),
            type: "move",
            message: `Moved ${building.name}`,
            resources: resources,
            details: {
              building: building.name,
              from: { x: building.x, y: building.y },
              to: { x: newX, y: newY },
            },
          };
          addLog(log);

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
    const log = {
      id: uuid("log_"),
      type: "collect",
      message: `Collected from ${building.name}`,
      resources: result.resources,
      details: {
        building: building.name,
        yield: result.delta,
      },
    };
    addLog(log);

    // 3. Update state
    setResources(result.resources);
  };

  const handleSell = (building) => {
    const buildingType = getBuildingTypeFromPalette(building.typeId);
    if (!buildingType) return;

    // 1. FIRST get the result
    const result = sim.applySell(resources, buildingType);
    if (!result) return;

    // 2. THEN create log
    const log = {
      id: uuid("log_"),
      type: "sell",
      message: `Sold ${building.name}`,
      resources: result.resources,
      details: {
        building: building.name,
        refund: result.delta,
      },
    };

    // 3. Update state
    setResources(result.resources);
    setBuildings((b) => b.filter((x) => x.id !== building.id));
    addLog(log);
  };

  const handleChunkClick = (chunk) => {
    setChunkDialog(chunk);
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

  // -----------------------------
  // Log Creation
  // -----------------------------
  const addLog = (newLog) => {
    setLogs((prevLogs) => {
      // If no logs yet, just add the new one
      if (prevLogs.length === 0) {
        return [{ ...newLog, count: 1 }];
      }

      const lastLog = prevLogs[prevLogs.length - 1];

      // Check if we can merge with the last log
      let canMerge = false;

      if (
        lastLog.type === newLog.type &&
        lastLog.details?.building === newLog.details?.building
      ) {
        // Merge all types: build, collect, and sell
        canMerge = true;
      }

      if (canMerge) {
        // Merge logs
        const mergedCount = (lastLog.count || 1) + 1;
        const mergedLog = {
          ...lastLog,
          count: mergedCount,
          resources: newLog.resources, // Update to latest resources
          // Clean message - remove any existing count prefix
          message: `${mergedCount}x ${newLog.message
            .replace(/^\d+x\s/, "")
            .replace(/^\(\d+\)\s/, "")}`,
        };

        // Replace last log with merged one
        return [...prevLogs.slice(0, -1), mergedLog];
      }

      // Can't merge, add as new log
      return [...prevLogs, { ...newLog, count: 1 }];
    });
  };

  // -----------------------------
  // Building Menu
  // -----------------------------

  // Add this to your state in App.js:
  const [buildingDialog, setBuildingDialog] = useState(null); // null | {building: null} for new | {building: object} for edit

  // Open dialog for new building:
  const handleCreateBuilding = () => {
    setBuildingDialog({ building: null });
  };

  const handleEditBuilding = (building) => {
    setBuildingDialog({ building });
  };

  const handleSaveBuilding = (buildingData, group) => {
    if (buildingDialog.building) {
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
      />

      {chunkDialog && (
        <ChunkDialog
          chunk={chunkDialog}
          onClose={() => setChunkDialog(null)}
          onUnlock={(type) => {
            console.log("Unlock with:", type);
            setChunkDialog(null);
          }}
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
    </div>
  );
}
