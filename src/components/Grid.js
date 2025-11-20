// Grid.js
import React from "react";
import { rectsOverlap } from "../utils";

/*
  Grid now uses chunk system: chunkSize = 4 (cells)
  Props:
    chunksMap: object keyed by "cx,cy" -> chunk {cx,cy,id}
    widthChunks, heightChunks optional (not required; chunksMap can be sparse)
    cellSize
    buildings: array with absolute x,y in cells (global cell coords)
    onPlace({...}) -> when user clicks a cell to place selected building
    selected: palette building object (with w,h)
    onRemove(buildingId)
*/

const chunkSize = 4;

function renderCellsForChunk(cx, cy, cellSize) {
  const cells = [];
  for (let ry = 0; ry < chunkSize; ry++) {
    const row = [];
    for (let rx = 0; rx < chunkSize; rx++) {
      row.push(
        <div
          key={`cell-${cx}-${cy}-${rx}-${ry}`}
          className="cell"
          style={{ width: cellSize, height: cellSize }}
          data-cell={`${cx},${cy},${rx},${ry}`}
        />
      );
    }
    cells.push(
      <div key={`row-${cx}-${cy}-${ry}`} style={{ display: "flex" }}>
        {row}
      </div>
    );
  }
  return cells;
}

export default function Grid({ chunksMap, chunksList, cellSize = 32, buildings = [], onPlace, selected, onRemove }) {
  // Determine bounds for rendering (minX..maxX in chunk coords)
  const keys = Object.keys(chunksMap);
  if (keys.length === 0) return <div>No chunks — add a 4x4 section to start</div>;

  let minCx = Infinity, minCy = Infinity, maxCx = -Infinity, maxCy = -Infinity;
  keys.forEach(k => {
    const [cx, cy] = k.split(",").map(Number);
    minCx = Math.min(minCx, cx);
    minCy = Math.min(minCy, cy);
    maxCx = Math.max(maxCx, cx);
    maxCy = Math.max(maxCy, cy);
  });

  const totalCols = (maxCx - minCx + 1) * 4;
  const totalRows = (maxCy - minCy + 1) * 4;

  // convert buildings to absolute map for overlap checks
  const placed = buildings.map(b => ({ x: b.x, y: b.y, w: b.w, h: b.h, id: b.id }));

  const handleCellClick = (event) => {
    if (!selected) return;
    // read dataset from clicked cell
    let el = event.target;
    const cellData = el.dataset.cell;
    if (!cellData) return;
    const [cx, cy, rx, ry] = cellData.split(",").map(Number);
    // compute absolute cell coords
    const absX = (cx * 4) + rx - (minCx * 4);
    const absY = (cy * 4) + ry - (minCy * 4);

    // compute absolute coords in global chunk space (not normalized)
    const globalX = (cx * 4) + rx;
    const globalY = (cy * 4) + ry;

    // We will store buildings with absolute global coords (globalX, globalY)
    // But we must ensure overlap across chunks is prevented.

    const area = { x: globalX, y: globalY, w: selected.w, h: selected.h };

    for (const p of placed) {
      if (rectsOverlap(area, p)) {
        alert("Cannot place here — overlap detected.");
        return;
      }
    }

    // Place: convert to a building instance with global coords
    onPlace({
      id: selected.id + "_" + Date.now(),
      typeId: selected.id,
      name: selected.name,
      w: selected.w,
      h: selected.h,
      POPULATION: selected.POPULATION || 0,
      DEMAND: selected.DEMAND || 0,
      EUPHORIA: selected.EUPHORIA || 0,
      CHRONO_ALLOY: selected.CHRONO_ALLOY || 0,
      GOODS_X: selected.GOODS_X || 0,
      x: globalX,
      y: globalY
    });
  };

  // Render a grid container with cell elements positioned
  // We render chunks in proper order rows->cols using minCx/minCy
  const containerStyle = {
    position: "relative",
    width: (maxCx - minCx + 1) * 4 * cellSize,
    height: (maxCy - minCy + 1) * 4 * cellSize,
    background: "linear-gradient(180deg,#081422,#071823)",
    borderRadius: 8,
    padding: 8,
    overflow: "auto"
  };

  // create a mapping from global cell to dataset cell element (for clicks)
  const chunkElements = [];
  for (let cy = minCy; cy <= maxCy; cy++) {
    for (let cx = minCx; cx <= maxCx; cx++) {
      const key = `${cx},${cy}`;
      if (!chunksMap[key]) {
        // render an empty area with dashed border to indicate no chunk
        chunkElements.push(
          <div key={`empty-${key}`} style={{
            position: "absolute",
            left: (cx - minCx) * 4 * cellSize,
            top: (cy - minCy) * 4 * cellSize,
            width: 4 * cellSize,
            height: 4 * cellSize,
            boxSizing: "border-box",
            border: "1px dashed rgba(255,255,255,0.04)",
            background: "rgba(255,255,255,0.01)"
          }} />
        );
        continue;
      }

      // Render the chunk area (4x4 cells)
      chunkElements.push(
        <div
          key={`chunk-${key}`}
          onClick={handleCellClick}
          style={{
            position: "absolute",
            left: (cx - minCx) * 4 * cellSize,
            top: (cy - minCy) * 4 * cellSize,
            width: 4 * cellSize,
            height: 4 * cellSize,
            boxSizing: "border-box",
            border: "1px solid rgba(255,255,255,0.03)",
            display: "flex",
            flexDirection: "column",
            cursor: selected ? "crosshair" : "default",
            background: "transparent"
          }}
        >
          {/* we'll render the 4 rows of small cells */}
          {[0,1,2,3].map((ry)=>(
            <div key={`r-${key}-${ry}`} style={{display:'flex', flex: '0 0 auto'}}>
              {[0,1,2,3].map((rx)=>(
                <div
                  key={`c-${key}-${rx}-${ry}`}
                  data-cell={`${cx},${cy},${rx},${ry}`}
                  className="cell"
                  style={{ width: cellSize, height: cellSize }}
                />
              ))}
            </div>
          ))}
        </div>
      );
    }
  }

  return (
    <div style={{ overflow: "auto" }}>
      <div style={containerStyle}>
        {chunkElements}
        {/* Buildings – convert building global x,y -> offset relative to minCx/minCy for display */}
        {buildings.map(b => {
          const dispLeft = (b.x - minCx * 4) * cellSize;
          const dispTop = (b.y - minCy * 4) * cellSize;
          return (
            <div
              key={b.id}
              onClick={(e) => { e.stopPropagation(); if (window.confirm("Remove building?")) onRemove(b.id); }}
              className="building"
              style={{
                left: dispLeft,
                top: dispTop,
                width: b.w * cellSize,
                height: b.h * cellSize,
                position: "absolute",
                background: "linear-gradient(180deg,#9ae6b4,#68d391)",
                border: "1px solid rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                cursor: "pointer"
              }}
            >
              {b.name}
            </div>
          );
        })}
      </div>
    </div>
  );
}
