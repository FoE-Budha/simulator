// src/App.js
import React, { useEffect, useState, useMemo } from "react";
import { uuid, rectsOverlap, nowTimestamp } from "./utils";
import * as sim from "./components/simulation";

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
        ts: nowTimestamp(),
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
        ts: nowTimestamp(),
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
        ts: nowTimestamp(),
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
      ts: nowTimestamp(),
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
      {/* Left panel */}
      <div
        style={{
          width: 320,
          padding: 12,
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <h3>Palette</h3>
        {Object.keys(paletteGroups).map((groupKey) => (
          <div key={groupKey} style={{ marginBottom: 8 }}>
            <strong>{groupKey}</strong>
            {(paletteGroups[groupKey] || []).map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: 6,
                  marginTop: 6,
                  background:
                    selectedType?.id === p.id
                      ? "rgba(6,182,212,0.12)"
                      : "transparent",
                  borderRadius: 6,
                }}
              >
                <div
                  onClick={() => setSelectedType(p)}
                  style={{ cursor: "pointer" }}
                >
                  {p.name}{" "}
                  <div style={{ fontSize: 11, opacity: 0.7 }}>
                    {p.w}x{p.h}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => {
                      // edit using prompt - you can replace with modal
                      const newName = prompt("Name:", p.name);
                      if (!newName) return;
                      // simple inline edit - update group array
                      setPaletteGroups((prev) => {
                        const next = { ...prev };
                        next[groupKey] = next[groupKey].map((x) =>
                          x.id === p.id ? { ...x, name: newName } : x
                        );
                        return next;
                      });
                    }}
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
        <div style={{ marginTop: 12 }}>
          <strong>Selected</strong>
          <div
            style={{
              padding: 8,
              marginTop: 6,
              background: "rgba(255,255,255,0.01)",
            }}
          >
            {selectedType ? (
              <div>
                {selectedType.name} ({selectedType.w}x{selectedType.h})
              </div>
            ) : (
              "(none)"
            )}
          </div>
        </div>
      </div>

      {/* Center map */}
      <div style={{ flex: 1, padding: 12 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <div>
            <strong>Map</strong>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => {
                // add a chunk to the right-most area
                // compute current maxCx, minCy (already computed)
                const newCx = maxCx + 1;
                const newCy = minCy;
                setChunksMap((prev) => ({
                  ...prev,
                  [`${newCx},${newCy}`]: {
                    id: uuid("chunk_"),
                    cx: newCx,
                    cy: newCy,
                  },
                }));
              }}
            >
              Add 4x4 section
            </button>
            <button
              onClick={() => {
                if (confirm("Clear all buildings?")) setBuildings([]);
              }}
            >
              Clear
            </button>
          </div>
        </div>

        <div
          style={{
            border: "1px solid rgba(255,255,255,0.04)",
            overflow: "auto",
            padding: 8,
          }}
        >
          <div
            onClick={handleGridClick}
            style={{
              width: cols * cellSize,
              height: rows * cellSize,
              position: "relative",
              background: "linear-gradient(180deg,#081422,#071823)",
            }}
          >
            {/* draw cell grid */}
            {Array.from({ length: rows }).map((_, r) => (
              <div key={r} style={{ display: "flex" }}>
                {Array.from({ length: cols }).map((__, c) => (
                  <div
                    key={c}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      border: "1px solid rgba(255,255,255,0.02)",
                      boxSizing: "border-box",
                    }}
                  />
                ))}
              </div>
            ))}

            {/* placed buildings */}
            {buildings.map((b) => {
              const left = (b.x - minCx * 4) * cellSize;
              const top = (b.y - minCy * 4) * cellSize;
              return (
                <div
                  key={b.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      confirm(
                        "Collect this building? (OK=collect, Cancel=sell)"
                      )
                    )
                      handleCollect(b.id);
                    else handleSell(b.id);
                  }}
                  style={{
                    position: "absolute",
                    left,
                    top,
                    width: b.w * cellSize,
                    height: b.h * cellSize,
                    background: "linear-gradient(180deg,#9ae6b4,#68d391)",
                    border: "1px solid rgba(0,0,0,0.6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  {b.name}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div
        style={{
          width: 360,
          padding: 12,
          background: "rgba(255,255,255,0.02)",
          overflow: "auto",
        }}
      >
        <h3>Stats</h3>
        <div>
          <div>Coins: {resources.coins}</div>
          <div>Supplies: {resources.supplies}</div>
          <div>Goods: {resources.goods}</div>
          <div>Alloy: {resources.alloy}</div>
          <div>Quantum: {resources.quantumActions}</div>

          <div style={{ marginTop: 8 }}>Population: {resources.population}</div>
          <div>
            Euphoria Units: {resources.euphoria} (ratio: {aggregates.euphRatio}%
            | multiplier: {aggregates.eupMultiplier}×)
          </div>
          <div>Coin Boost: {Math.round(resources.coinBoost * 100)}%</div>
          <div>Supply Boost: {Math.round(resources.suppliesBoost * 100)}%</div>

          <div style={{ marginTop: 8 }}>
            <button onClick={() => saveSnapshot()}>Save Snapshot</button>
            <button onClick={() => exportLogs()} style={{ marginLeft: 8 }}>
              Export Logs
            </button>
          </div>
        </div>

        <h4 style={{ marginTop: 12 }}>Snapshots</h4>
        <div>
          {snapshots.map((s) => (
            <div
              key={s.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 6,
                background: "rgba(255,255,255,0.01)",
                marginTop: 6,
              }}
            >
              <div>
                <div style={{ fontSize: 13 }}>{s.name}</div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>{s.ts}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => compareSnapshot(s.id)}>Compare</button>
                <button
                  onClick={() => {
                    if (
                      confirm(
                        "Restore this snapshot (replaces current resources & map)?"
                      )
                    ) {
                      setBuildings(s.buildings);
                      setResources(s.resources);
                      setLogs(s.logs);
                      alert("Restored");
                    }
                  }}
                >
                  Restore
                </button>
              </div>
            </div>
          ))}
        </div>

        <h4 style={{ marginTop: 12 }}>Last Compare</h4>
        {lastCompare ? (
          <div>
            <div>Snapshot: {lastCompare.snap.name}</div>
            <div>Δ Coins: {lastCompare.diff.coins}</div>
            <div>Δ Supplies: {lastCompare.diff.supplies}</div>
            <div>Δ Alloy: {lastCompare.diff.alloy}</div>
            <div>Δ Population: {lastCompare.diff.population}</div>
          </div>
        ) : (
          <div style={{ opacity: 0.7 }}>No comparison yet</div>
        )}

        <h4 style={{ marginTop: 12 }}>Action Log</h4>
        <div
          style={{
            maxHeight: 240,
            overflow: "auto",
            background: "rgba(0,0,0,0.12)",
            padding: 8,
          }}
        >
          {logs.map((l) => (
            <div key={l.id} style={{ marginBottom: 6, fontSize: 13 }}>
              <div>
                <strong>
                  [{l.ts}] {l.kind.toUpperCase()}
                </strong>{" "}
                {l.label}
              </div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>
                {formatDelta(l.delta)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
