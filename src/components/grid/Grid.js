import React from "react";
import { rectsOverlap } from "../../utils";
import "./Grid.css";

const chunkSize = 4;

export default function Grid({
  chunksMap,
  buildings = [],
  cellSize = 32,
  selected,
  onPlace,
  onRemove,
  onChunkAction, // NEW: for locked / blocked clicks
}) {
  const keys = Object.keys(chunksMap);
  if (!keys.length) return null;

  let minCx = Infinity,
    minCy = Infinity;
  let maxCx = -Infinity,
    maxCy = -Infinity;

  keys.forEach((k) => {
    const [cx, cy] = k.split(",").map(Number);
    minCx = Math.min(minCx, cx);
    minCy = Math.min(minCy, cy);
    maxCx = Math.max(maxCx, cx);
    maxCy = Math.max(maxCy, cy);
  });

  const placed = buildings.map((b) => ({
    x: b.x,
    y: b.y,
    w: b.w,
    h: b.h,
  }));

  function handleCellClick(e, chunk) {
    e.stopPropagation();

    if (chunk.state !== "available") {
      onChunkAction?.(chunk);
      return;
    }

    if (!selected) return;

    const cell = e.target.dataset.cell;
    if (!cell) return;

    const [cx, cy, rx, ry] = cell.split(",").map(Number);
    const globalX = cx * 4 + rx;
    const globalY = cy * 4 + ry;

    const area = { x: globalX, y: globalY, w: selected.w, h: selected.h };

    for (const p of placed) {
      if (rectsOverlap(area, p)) return;
    }

    onPlace({
      id: `${selected.id}_${Date.now()}`,
      ...selected,
      x: globalX,
      y: globalY,
    });
  }

  return (
    <div className="grid-container">
      <div
        className="grid-inner"
        style={{
          width: (maxCx - minCx + 1) * 4 * cellSize,
          height: (maxCy - minCy + 1) * 4 * cellSize,
        }}
      >
        {Object.values(chunksMap).map((chunk) => {
          const { cx, cy, state } = chunk;

          const left = (cx - minCx) * 4 * cellSize;
          const top = (cy - minCy) * 4 * cellSize;

          return (
            <div
              key={chunk.id}
              className={`chunk ${state}`}
              style={{
                left,
                top,
                width: 4 * cellSize,
                height: 4 * cellSize,
              }}
              onClick={(e) => handleCellClick(e, chunk)}
            >
              {[0, 1, 2, 3].map((ry) => (
                <div key={ry} className="row">
                  {[0, 1, 2, 3].map((rx) => (
                    <div
                      key={rx}
                      className="cell"
                      data-cell={`${cx},${cy},${rx},${ry}`}
                      style={{ width: cellSize, height: cellSize }}
                    />
                  ))}
                </div>
              ))}
            </div>
          );
        })}

        {buildings.map((b) => (
          <div
            key={b.id}
            className="building"
            style={{
              left: (b.x - minCx * 4) * cellSize,
              top: (b.y - minCy * 4) * cellSize,
              width: b.w * cellSize,
              height: b.h * cellSize,
            }}
            onClick={() => onRemove(b.id)}
          >
            {b.name}
          </div>
        ))}
      </div>
    </div>
  );
}
