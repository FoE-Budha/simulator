// src/App.js
import React, { useEffect, useState, useMemo } from "react";
import { uuid, rectsOverlap, nowTimestamp } from "./utils";
import * as sim from "./components/simulation";
import PalettePanel from "./components/PalettePanel";
import MapPanel from "./components/MapPanel";
import StatsPanel from "./components/StatsPanel";

// import palette from root
import { DEFAULT_PALETTE } from "./default_palette";

// If you have components, import them:
// import Palette from './components/Palette';
// import Grid from './components/Grid';
// import Inspector from './components/Inspector';

// For minimal integration, we render simple UI here.

function formatDelta(delta) {
  const parts = [];
  if (!delta) return "";
  for (const k of Object.keys(delta)) {
    const v = delta[k];
    if (v === 0) continue;
    parts.push(`${k} ${v > 0 ? "+" : ""}${v}`);
  }
  return parts.join(", ");
}

export default function App() {
  // resources: initial values (from your earlier message)
  const [resources, setResources] = useState({
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
  });

  // palette groups (from default)
  const [paletteGroups, setPaletteGroups] = useState(DEFAULT_PALETTE);

  // chunks map initial: 3 rows x 4 cols (cx: 0..3, cy: 0..2)
  const [chunksMap, setChunksMap] = useState(() => {
    const m = {};
    for (let cy = 0; cy < 3; cy++) {
      for (let cx = 0; cx < 4; cx++) {
        m[`${cx},${cy}`] = { id: uuid("chunk_"), cx, cy };
      }
    }
    return m;
  });

  // building instances placed on map (global coords)
  const [buildings, setBuildings] = useState([]); // each: { id, typeId, name, w,h,x,y }

  // logs & snapshots
  const [logs, setLogs] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [lastCompare, setLastCompare] = useState(null);

  // selected palette item
  const [selectedType, setSelectedType] = useState(null);

  // derived aggregates
  const aggregates = useMemo(
    () => sim.computeAggregates(buildings, paletteGroups),
    [buildings, paletteGroups]
  );

  // recompute resources summary when buildings change (population/euphoria/boosts)
  useEffect(() => {
    // recalc placement effects and update resource-derived fields (but do not change coins/supplies/alloy)
    setResources((prev) => {
      const next = { ...prev };
      // compute aggregates but leave monetary resources unchanged
      next.population = aggregates.POPULATION;
      next.euphoria = aggregates.EUPHORIA;
      next.coinBoost = aggregates.COINBOOST;
      next.suppliesBoost = aggregates.SUPPLIESBOOST;
      next.attack = aggregates.ATTACK;
      next.defense = aggregates.DEFENSE;
      return next;
    });
  }, [aggregates]);

  // Helper: find type by id
  function findType(typeId) {
    for (const g of Object.keys(paletteGroups)) {
      const arr = paletteGroups[g];
      const found = arr && arr.find((t) => t.id === typeId);
      if (found) return found;
    }
    // fallback to default palette
    for (const g of Object.keys(DEFAULT_PALETTE)) {
      const found = DEFAULT_PALETTE[g].find((t) => t.id === typeId);
      if (found) return found;
    }
    return null;
  }

  // Event: place building at absolute global coords (x,y) where x,y are cells (chunk*4 + offset)
  function handlePlaceAt(x, y) {
    if (!selectedType) return alert("Select a building type first");
    const type = selectedType;
    // check overlap
    const area = { x, y, w: Number(type.w), h: Number(type.h) };
    for (const b of buildings) {
      if (rectsOverlap(area, b))
        return alert("Overlap detected, cannot place here");
    }

    // apply costs & placement effects via sim.applyBuild
    setResources((prev) => {
      const copy = { ...prev };
      const res = sim.applyBuild(copy, type);
      // log the build
      const entry = {
        id: uuid("log_"),
        kind: "build",
        label: type.name,
        detail: `Build ${type.name}`,
        delta: res.delta,
      };
      setLogs((l) => [...l, entry]);
      return copy;
    });

    // add instance
    const inst = {
      id: uuid("inst_"),
      typeId: type.id,
      name: type.name,
      w: Number(type.w),
      h: Number(type.h),
      x,
      y,
    };
    setBuildings((prev) => [...prev, inst]);
  }

  // Event: collect a specific instance
  function handleCollect(instanceId) {
    const inst = buildings.find((b) => b.id === instanceId);
    if (!inst) return;
    const type = findType(inst.typeId) || inst;
    // Use aggregates as global multipliers
    setResources((prev) => {
      const copy = { ...prev };
      const res = sim.applyCollect(copy, type, aggregates);
      // log
      const entry = {
        id: uuid("log_"),
        kind: "collect",
        label: type.name,
        detail: `Collect ${type.name}`,
        delta: res.delta,
      };
      setLogs((l) => [...l, entry]);
      return copy;
    });
  }

  // Event: sell building (collect + refund 25%), also removes instance
  function handleSell(instanceId) {
    const inst = buildings.find((b) => b.id === instanceId);
    if (!inst) return;
    const type = findType(inst.typeId) || inst;
    setResources((prev) => {
      const copy = { ...prev };
      const res = sim.applySell(copy, type);
      // remove placement effects (reverse of applyBuild)
      const pe = sim.placementEffects(type);
      copy.population = Math.max(0, copy.population - pe.population);
      copy.euphoria = Math.max(0, copy.euphoria - pe.euphoria);
      copy.coinBoost = Math.max(0, copy.coinBoost - pe.coinBoost);
      copy.suppliesBoost = Math.max(0, copy.suppliesBoost - pe.suppliesBoost);
      copy.attack = Math.max(0, copy.attack - pe.attack);
      copy.defense = Math.max(0, copy.defense - pe.defense);

      const entry = {
        id: uuid("log_"),
        kind: "sell",
        label: type.name,
        detail: `Sell ${type.name}`,
        delta: res.delta,
      };
      setLogs((l) => [...l, entry]);
      return copy;
    });

    // remove building from map
    setBuildings((prev) => prev.filter((b) => b.id !== instanceId));
  }

  // Snapshot save
  function saveSnapshot(name) {
    const sn = {
      id: uuid("snap_"),
      name: name || `Snapshot ${snapshots.length + 1}`,
      resources: { ...resources },
      buildings: JSON.parse(JSON.stringify(buildings)),
      logs: JSON.parse(JSON.stringify(logs)),
    };
    setSnapshots((prev) => [...prev, sn]);
    alert("Snapshot saved: " + sn.name);
  }

  // Compare snapshot to current resources
  function compareSnapshot(snapId) {
    const snap = snapshots.find((s) => s.id === snapId);
    if (!snap) return;
    const cur = resources;
    const diff = {
      coins: cur.coins - snap.resources.coins,
      supplies: cur.supplies - snap.resources.supplies,
      goods: cur.goods - snap.resources.goods,
      alloy: cur.alloy - snap.resources.alloy,
      population: cur.population - snap.resources.population,
    };
    setLastCompare({ snap, diff });
  }

  // Export logs
  function exportLogs() {
    const blob = new Blob([JSON.stringify(logs, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `foe_logs_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Simple grid rendering with chunk awareness: clicking a cell places selected type
  // This is a simplified renderer (if you have Grid component, hook handlePlaceAt into it)
  // compute bounding box for rendering
  const chunkKeys = Object.keys(chunksMap);
  let minCx = Infinity,
    minCy = Infinity,
    maxCx = -Infinity,
    maxCy = -Infinity;
  chunkKeys.forEach((k) => {
    const [cx, cy] = k.split(",").map(Number);
    minCx = Math.min(minCx, cx);
    minCy = Math.min(minCy, cy);
    maxCx = Math.max(maxCx, cx);
    maxCy = Math.max(maxCy, cy);
  });
  const cols = (maxCx - minCx + 1) * 4;
  const rows = (maxCy - minCy + 1) * 4;
  const cellSize = 24;

  // helper: convert click to absolute global coords
  function handleGridClick(e) {
    // compute bounding rect of container
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);
    // convert to global coordinates relative to minCx,minCy
    const globalX = x + minCx * 4;
    const globalY = y + minCy * 4;
    handlePlaceAt(globalX, globalY);
  }

  // UI render
  return (
    <div style={{ display: "flex", height: "100vh", gap: 12 }}>
      <PalettePanel
        paletteGroups={paletteGroups}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        onEdit={() => {}}
        onCreate={() => {}}
      />

      <MapPanel
        cols={cols}
        rows={rows}
        cellSize={cellSize}
        buildings={buildings}
        minCy={minCy}
        minCx={minCx}
        maxCx={maxCx}
        handleGridClick={handleGridClick}
        handleCollect={handleCollect}
        handleSell={handleSell}
        setChunksMap={setChunksMap}
        setBuildings={setBuildings}
        uuid={uuid}
      />

      <StatsPanel
        resources={resources}
        aggregates={aggregates}
        snapshots={snapshots}
        logs={logs}
        lastCompare={lastCompare}
        saveSnapshot={saveSnapshot}
        exportLogs={exportLogs}
        compareSnapshot={compareSnapshot}
        setBuildings={setBuildings}
        setResources={setResources}
        setLogs={setLogs}
        formatDelta={formatDelta}
      />
    </div>
  );
}
