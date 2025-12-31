// src/App.js
import React, { useState, useMemo } from "react";
import { uuid } from "../utils";

import PalettePanel from "../components/palette/PalettePanel";
import MapPanel from "../components/MapPanel";
import StatsPanel from "../components/stats/StatsPanel";
//import ChunkDialog from "./components/dialogs/ChunkDialog";

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
  // CORE ACTIONS
  // -----------------------------

  const handlePlaceBuilding = (x, y) => {
    if (!selectedType) return;

    const result = sim.applyBuild(resources, selectedType);
    if (!result) return;

    setResources(result.resources);
    setLogs((l) => [...l, result.log]);

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

  const handleCollect = (building) => {
    const result = sim.applyCollect(resources, building, aggregates);
    setResources(result.resources);
    setLogs((l) => [...l, result.log]);
  };

  const handleSell = (building) => {
    const result = sim.applySell(resources, building);
    setResources(result.resources);
    setBuildings((b) => b.filter((x) => x.id !== building.id));
    setLogs((l) => [...l, result.log]);
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
  // RENDER
  // -----------------------------

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <PalettePanel
        paletteGroups={paletteGroups}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
      />

      <MapPanel
        chunksMap={chunksMap}
        buildings={buildings}
        selectedType={selectedType}
        onPlace={handlePlaceBuilding}
        onChunkClick={handleChunkClick}
        onCollect={handleCollect}
        onSell={handleSell}
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
    </div>
  );
}
