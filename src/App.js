// App.js
import React, { useEffect, useState } from "react";
import Palette from "./components/Palette";
import Grid from "./components/Grid";
import Inspector from "./components/Inspector";
import { uuid, rectsOverlap } from "./utils";
import { DEFAULT_PALETTE } from './components/default_palette';

/*
  New state shapes:
    paletteGroups: { residential: [], production: [], goods: [], decorations: [], army: [], cultural: [] }
    chunksMap: { "cx,cy": { id, cx, cy } }  // sparse map of chunks
    buildings: [ { id, typeId, name, w,h, x,y, POPULATION, DEMAND, EUPHORIA, CHRONO_ALLOY, GOODS_X } ] // x,y are global cell coords
*/

const DEFAULT_GROUP_KEYS = ["residential", "production", "goods", "decorations", "army", "cultural"];

const starterPalette = {
  residential: [],
  production: [],
  goods: [],
  decorations: [],
  army: [],
  cultural: []
};

// helper: compute totals with euphoria multiplier
function computeTotals(buildings) {
  let POPULATION = 0, DEMAND = 0, EUPHORIA = 0, CHRONO_ALLOY = 0, GOODS_X = 0;
  buildings.forEach(b => {
    POPULATION += b.POPULATION || 0;
    DEMAND += b.DEMAND || 0;
    EUPHORIA += b.EUPHORIA || 0;
    CHRONO_ALLOY += b.CHRONO_ALLOY || 0;
    GOODS_X += b.GOODS_X || 0;
  });
  const ratio = DEMAND > 0 ? Math.round((EUPHORIA / DEMAND) * 100) : 100;
  let multiplier = 1;
  if (ratio <= 20) multiplier = 0.2;
  else if (ratio <= 60) multiplier = 0.6;
  else if (ratio <= 80) multiplier = 0.8;
  else if (ratio <= 120) multiplier = 1;
  else if (ratio <= 140) multiplier = 1.1;
  else if (ratio <= 199) multiplier = 1.2;
  else multiplier = 1.5;
  return {
    POPULATION, DEMAND, EUPHORIA, ratio, multiplier,
    CHRONO_ALLOY: Math.round(CHRONO_ALLOY * multiplier),
    GOODS_X: Math.round(GOODS_X * multiplier)
  };
}

export default function App() {
  // palette groups
  const [paletteGroups, setPaletteGroups] = useState(DEFAULT_PALETTE);

  // selected palette item
  const [selected, setSelected] = useState(null);

  // chunks map: keyed by "cx,cy"
  const [chunksMap, setChunksMap] = useState({});

  // buildings placed with absolute global cell coords
  const [buildings, setBuildings] = useState([]);

  // snapshots
  const [snapshots, setSnapshots] = useState([]);

  // last compare data
  const [lastCompare, setLastCompare] = useState(null);

  // creation/edit modal state
  const [editing, setEditing] = useState(null); // { mode: 'create'|'edit', payload: buildingType }

  // On mount initialize default chunks (3 rows x 4 cols)
  useEffect(() => {
    // default anchor: start at cx=0..3 and cy=0..2 (4 cols x 3 rows)
    const map = {};
    for (let cy = 0; cy < 3; cy++) {
      for (let cx = 0; cx < 4; cx++) {
        map[`${cx},${cy}`] = { id: uuid("chunk_"), cx, cy };
      }
    }
    setChunksMap(map);

    // Also create a minimal default palette sample so user can start (will be removed when you provide your own)
    setPaletteGroups({
      residential: [
        { id: "t1_house", group: "residential", name: "T1 House", w: 1, h: 1, POPULATION: 10, DEMAND: 10 }
      ],
      production: [
        { id: "town_hall", group: "production", name: "Town Hall", w: 3, h: 2, CHRONO_ALLOY: 50, PROD_10H: 5000 }
      ],
      goods: [],
      decorations: [
        { id: "small_park", group: "decorations", name: "Small Park", w: 1, h: 1, EUPHORIA: 10 }
      ],
      army: [],
      cultural: [
        { id: "church", group: "cultural", name: "Church", w: 1, h: 1, EUPHORIA: 20 }
      ]
    });
  }, []);

  function handleSelectPalette(p) {
    setSelected(p);
  }

  function handlePlace(buildingInstance) {
    // buildingInstance.x,y are global cell coords
    // check overlap with existing buildings
    const area = { x: buildingInstance.x, y: buildingInstance.y, w: buildingInstance.w, h: buildingInstance.h };
    for (const b of buildings) {
      if (rectsOverlap(area, b)) {
        alert("Overlap detected — cannot place here.");
        return;
      }
    }
    setBuildings(prev => [...prev, buildingInstance]);
  }

  function handleRemove(buildingId) {
    setBuildings(prev => prev.filter(b => b.id !== buildingId));
  }

  // create or edit a palette building
  function handleCreateOrEdit(type, mode = "create") {
    // show a prompt-based form (simple)
    const name = prompt("Name:", type?.name || "");
    if (!name) return;
    const w = parseInt(prompt("Width (cells):", String(type?.w || 1)) || "1", 10);
    const h = parseInt(prompt("Height (cells):", String(type?.h || 1)) || "1", 10);
    const group = prompt("Group (residential, production, goods, decorations, army, cultural):", type?.group || "residential");
    const POPULATION = parseInt(prompt("POPULATION (0 if none):", String(type?.POPULATION || 0)), 10) || 0;
    const DEMAND = parseInt(prompt("DEMAND (0 if none):", String(type?.DEMAND || 0)), 10) || 0;
    const EUPHORIA = parseInt(prompt("EUPHORIA (0 if none):", String(type?.EUPHORIA || 0)), 10) || 0;
    const CHRONO_ALLOY = parseInt(prompt("CHRONO_ALLOY (0 if none):", String(type?.CHRONO_ALLOY || 0)), 10) || 0;
    const GOODS_X = parseInt(prompt("GOODS_X (0 if none):", String(type?.GOODS_X || 0)), 10) || 0;

    const newType = {
      id: (type?.id) || (name.replace(/\s+/g, "_").toLowerCase() + "_" + Date.now()),
      group,
      name,
      w,
      h,
      POPULATION, DEMAND, EUPHORIA, CHRONO_ALLOY, GOODS_X
    };

    setPaletteGroups(prev => {
      const next = { ...prev };
      // remove existing type from old group if editing and group changed
      if (mode === "edit" && type) {
        // remove old
        Object.keys(next).forEach(k => next[k] = next[k].filter(x => x.id !== type.id));
      }
      // add to new group (append)
      next[group] = [...(next[group] || []), newType];
      return next;
    });

    // if editing, update all placed buildings of that type id
    if (mode === "edit" && type) {
      setBuildings(prev => prev.map(b => b.typeId === type.id ? {
        ...b,
        typeId: newType.id,
        name: newType.name,
        w: newType.w,
        h: newType.h,
        POPULATION: newType.POPULATION,
        DEMAND: newType.DEMAND,
        EUPHORIA: newType.EUPHORIA,
        CHRONO_ALLOY: newType.CHRONO_ALLOY,
        GOODS_X: newType.GOODS_X
      } : b));
    }

    // if created new, select it for placement
    if (mode === "create") setSelected(newType);
  }

  function handleEditPalette(type) {
    // mode edit
    if (!type) return;
    if (!confirm(`Edit building type "${type.name}"?`)) return;
    // find the original type in palette
    // remove original element and run create-or-edit in edit mode
    // We'll reuse the prompt-based form
    handleCreateOrEdit(type, "edit");
  }

  function handleDeletePalette(type) {
    if (!type) return;
    if (!confirm(`Delete building type "${type.name}"? This will NOT remove placed instances.`)) return;
    setPaletteGroups(prev => {
      const next = { ...prev };
      next[type.group] = (next[type.group] || []).filter(x => x.id !== type.id);
      return next;
    });
  }

  // snapshots
  function handleSnapshot() {
    const name = prompt("Snapshot name:", "snap_" + (snapshots.length + 1));
    if (!name) return;
    const s = { id: uuid("snap_"), name, buildings: JSON.parse(JSON.stringify(buildings)), totals: computeTotals(buildings) };
    setSnapshots(prev => [...prev, s]);
    alert("Snapshot saved");
  }

  function handleCompare(snapshot) {
    const cur = computeTotals(buildings);
    setLastCompare({ current: cur, snap: snapshot.totals, name: snapshot.name });
    alert("Compared to snapshot: " + snapshot.name);
  }

  function handleExport() {
    const data = {
      chunks: chunksMap,
      paletteGroups,
      buildings
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "foe_layout.json"; a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e) {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data.chunks) return alert("Invalid file (missing chunks)");
        setChunksMap(data.chunks);
        setPaletteGroups(data.paletteGroups || paletteGroups);
        setBuildings(data.buildings || []);
        alert("Imported layout");
      } catch (err) {
        alert("Invalid file");
      }
    };
    reader.readAsText(f);
  }

  // chunk adding: add a single 4x4 chunk in a direction relative to current bounding box
  function handleAddChunk(direction = "right") {
    // compute bounding coords
    const keys = Object.keys(chunksMap);
    let minCx = Infinity, minCy = Infinity, maxCx = -Infinity, maxCy = -Infinity;
    keys.forEach(k => {
      const [cx, cy] = k.split(",").map(Number);
      minCx = Math.min(minCx, cx);
      minCy = Math.min(minCy, cy);
      maxCx = Math.max(maxCx, cx);
      maxCy = Math.max(maxCy, cy);
    });

    let target = null;
    if (direction === "left") {
      target = { cx: minCx - 1, cy: minCy }; // place row-wise at top-left area; user can add more as needed
    } else if (direction === "right") {
      target = { cx: maxCx + 1, cy: minCy };
    } else if (direction === "up") {
      target = { cx: minCx, cy: minCy - 1 };
    } else if (direction === "down") {
      target = { cx: minCx, cy: maxCy + 1 };
    } else {
      // default add at max right
      target = { cx: maxCx + 1, cy: minCy };
    }

    // ensure not occupied
    const key = `${target.cx},${target.cy}`;
    setChunksMap(prev => {
      if (prev[key]) {
        alert("Chunk already exists at " + key);
        return prev;
      }
      const next = { ...prev, [key]: { id: uuid("chunk_"), cx: target.cx, cy: target.cy } };
      return next;
    });
  }

  function handleClearAll() {
    if (!confirm("Clear all placed buildings?")) return;
    setBuildings([]);
  }

  function handleDeleteBuildingType(type) {
    // wrapper used by Palette delete button
    handleDeletePalette(type);
  }

  // update a building type (used when editing) – we already do this in handleCreateOrEdit
  // totals
  const totals = computeTotals(buildings);

  // convenience: build list of groups for Palette component:
  // ensure each group exists
  const groupsForPalette = {};
  DEFAULT_GROUP_KEYS.forEach(k => groupsForPalette[k] = paletteGroups[k] || []);

  // export compare snapshot display logic (optional)
  return (
    <div className="app">
      {/* Left panel */}
      <div className="sidebar">
        <div className="header">Palette & Map</div>
        <Palette
          paletteGroups={groupsForPalette}
          onSelect={handleSelectPalette}
          onCreate={() => handleCreateOrEdit(null, "create")}
          onEdit={handleEditPalette}
          onDelete={handleDeleteBuildingType}
        />

        <div style={{ marginTop: 10 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Selected</div>
          <div style={{ padding: 8, background: "rgba(255,255,255,0.02)", borderRadius: 6 }}>
            {selected ? <div><div style={{ fontSize: 14 }}>{selected.name}</div><div style={{ fontSize: 11, opacity: 0.8 }}>{selected.w}x{selected.h}</div></div> : "(none)"}
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="button small" onClick={() => {
              if (!selected) return alert("Select a palette item first");
              // quick fill: fill existing chunks with single-cell placements if building is 1x1
              if (selected.w !== 1 || selected.h !== 1) return alert("Quick fill only supports 1x1 types");
              if (!confirm("Fill all available cells with selected building?")) return;
              // compute bounding box
              const keys = Object.keys(chunksMap);
              let minCx = Infinity, minCy = Infinity, maxCx = -Infinity, maxCy = -Infinity;
              keys.forEach(k => {
                const [cx, cy] = k.split(",").map(Number);
                minCx = Math.min(minCx, cx);
                minCy = Math.min(minCy, cy);
                maxCx = Math.max(maxCx, cx);
                maxCy = Math.max(maxCy, cy);
              });
              const list = [];
              for (let cy = minCy; cy <= maxCy; cy++) {
                for (let cx = minCx; cx <= maxCx; cx++) {
                  if (!chunksMap[`${cx},${cy}`]) continue;
                  for (let ry = 0; ry < 4; ry++) {
                    for (let rx = 0; rx < 4; rx++) {
                      const gx = cx * 4 + rx;
                      const gy = cy * 4 + ry;
                      // skip overlaps
                      if (buildings.some(b => rectsOverlap({ x: gx, y: gy, w: 1, h: 1 }, b))) continue;
                      list.push({
                        id: selected.id + "_" + Date.now() + "_" + gx + "_" + gy,
                        typeId: selected.id,
                        name: selected.name,
                        w: selected.w,
                        h: selected.h,
                        POPULATION: selected.POPULATION || 0,
                        DEMAND: selected.DEMAND || 0,
                        EUPHORIA: selected.EUPHORIA || 0,
                        CHRONO_ALLOY: selected.CHRONO_ALLOY || 0,
                        GOODS_X: selected.GOODS_X || 0,
                        x: gx,
                        y: gy
                      });
                    }
                  }
                }
              }
              setBuildings(prev => [...prev, ...list]);
            }}>Fill with Selected</button>

            <button className="button small" onClick={() => {
              if (!confirm("Clear all placed buildings?")) return;
              setBuildings([]);
            }}>Clear</button>

            <button className="button small" onClick={() => {
              if (!confirm("Reset default layout? This will clear all buildings and chunks and reset to default")) return;
              // reset to default chunks (3x4)
              const map = {};
              for (let cy = 0; cy < 3; cy++) {
                for (let cx = 0; cx < 4; cx++) {
                  map[`${cx},${cy}`] = { id: uuid("chunk_"), cx, cy };
                }
              }
              setChunksMap(map);
              setBuildings([]);
              alert("Reset done");
            }}>Reset</button>

          </div>
        </div>
      </div>

      {/* Center map area */}
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div><strong>Map</strong></div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="button small" onClick={() => {
              // quick add chunk to the right
              handleAddChunk('right');
            }}>Add 4×4 section</button>
          </div>
        </div>

        <Grid
          chunksMap={chunksMap}
          cellSize={32}
          buildings={buildings}
          onPlace={handlePlace}
          selected={selected}
          onRemove={handleRemove}
        />

        {lastCompare && (
          <div style={{ marginTop: 12, background: "rgba(255,255,255,0.02)", padding: 8, borderRadius: 6 }}>
            <strong>Last Comparison — {lastCompare.name}</strong>
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <div>
                <div><strong>Current</strong></div>
                <div>Alloy: {lastCompare.current.CHRONO_ALLOY}</div>
                <div>Goods: {lastCompare.current.GOODS_X}</div>
              </div>
              <div>
                <div><strong>Snapshot</strong></div>
                <div>Alloy: {lastCompare.snap.CHRONO_ALLOY}</div>
                <div>Goods: {lastCompare.snap.GOODS_X}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right side panel */}
      <div className="sidebar">
        <div className="header">Stats & Snapshots</div>
        <Inspector
          totals={totals}
          onSnapshot={handleSnapshot}
          snapshots={snapshots}
          onCompare={handleCompare}
          onExport={handleExport}
          onImport={handleImport}
          onAddChunk={handleAddChunk}
          onClear={handleClearAll}
        />

      </div>
    </div>
  );
}