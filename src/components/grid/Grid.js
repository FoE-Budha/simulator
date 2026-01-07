import React, { useState, useMemo } from "react";
import { rectsOverlap } from "../../utils";
import "./Grid.css";

const chunkSize = 4;

export default function Grid({
  chunksMap,
  buildings = [],
  cellSize = 32,
  selected,
  selectedForMove,
  mode,
  onPlace,
  onBuildingClick,
  onChunkAction,
}) {
  const [hoverPosition, setHoverPosition] = useState(null);

  // Always call hooks at the top level, unconditionally
  const keys = Object.keys(chunksMap);

  // Calculate availableChunks unconditionally
  const availableChunks = useMemo(() => {
    const chunks = {};
    Object.values(chunksMap).forEach((chunk) => {
      if (chunk.state === "available") {
        chunks[`${chunk.cx},${chunk.cy}`] = true;
      }
    });
    return chunks;
  }, [chunksMap]);

  // Return null AFTER all hooks have been called
  if (!keys.length) {
    return (
      <div className="grid-container">
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            color: "#94a3b8",
          }}
        >
          No chunks available
        </div>
      </div>
    );
  }

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

  // Rest of the component remains the same...
  const placed = buildings.map((b) => ({
    x: b.x,
    y: b.y,
    w: b.w,
    h: b.h,
  }));

  // Helper function to get all chunks a building occupies
  function getChunksForBuilding(globalX, globalY, width, height) {
    const chunks = new Set();

    for (let x = globalX; x < globalX + width; x++) {
      for (let y = globalY; y < globalY + height; y++) {
        const chunkX = Math.floor(x / 4);
        const chunkY = Math.floor(y / 4);
        chunks.add(`${chunkX},${chunkY}`);
      }
    }

    return Array.from(chunks).map((str) => {
      const [cx, cy] = str.split(",").map(Number);
      return [cx, cy];
    });
  }

  function handleCellClick(e, chunk) {
    e.stopPropagation();

    if (chunk.state !== "available") {
      onChunkAction?.(chunk);
      return;
    }

    const cell = e.target.dataset.cell;
    if (!cell) return;

    const [cx, cy, rx, ry] = cell.split(",").map(Number);
    const globalX = cx * 4 + rx;
    const globalY = cy * 4 + ry;

    // Handle different modes
    if (mode === "place" && selected) {
      // Check if building fits
      if (rx + selected.w > 4 || ry + selected.h > 4) {
        // Check multi-chunk placement
        const buildingChunks = getChunksForBuilding(
          globalX,
          globalY,
          selected.w,
          selected.h
        );
        const allChunksAvailable = buildingChunks.every(
          ([chunkX, chunkY]) => availableChunks[`${chunkX},${chunkY}`]
        );

        if (!allChunksAvailable) {
          console.log("Building doesn't fit in available chunks");
          return;
        }
      }

      const area = { x: globalX, y: globalY, w: selected.w, h: selected.h };

      for (const p of placed) {
        if (rectsOverlap(area, p)) {
          console.log("Collision detected with existing building");
          return;
        }
      }

      onPlace(globalX, globalY);
    } else if (mode === "move" && selectedForMove) {
      console.log("Attempting to move building to:", { globalX, globalY });
      console.log("Selected building info:", selectedForMove);

      const area = {
        x: globalX,
        y: globalY,
        w: selectedForMove.w,
        h: selectedForMove.h,
      };

      // Check collision with other buildings (excluding the one being moved)
      for (const b of buildings) {
        if (b.id === selectedForMove.id) {
          console.log("Skipping self:", b.id);
          continue;
        }

        const bArea = { x: b.x, y: b.y, w: b.w, h: b.h };
        console.log("Checking against building:", b, "Area:", bArea);

        if (rectsOverlap(area, bArea)) {
          console.log("COLLISION DETECTED with building:", b.id);
          console.log("Cannot move here - collision with existing building");
          return;
        }
      }

      // Check if all chunks under the building are available
      const buildingChunks = getChunksForBuilding(
        globalX,
        globalY,
        selectedForMove.w,
        selectedForMove.h
      );
      const allChunksAvailable = buildingChunks.every(
        ([chunkX, chunkY]) => availableChunks[`${chunkX},${chunkY}`]
      );

      if (!allChunksAvailable) {
        console.log("Cannot move here - chunks not available");
        return;
      }

      onPlace(globalX, globalY);
    }
  }

  function handleCellHover(e, chunk) {
    if (chunk.state !== "available") {
      setHoverPosition(null);
      return;
    }

    const cell = e.target.dataset.cell;
    if (!cell) {
      setHoverPosition(null);
      return;
    }

    const [cx, cy, rx, ry] = cell.split(",").map(Number);
    const globalX = cx * 4 + rx;
    const globalY = cy * 4 + ry;

    // Show hover preview based on mode
    if (mode === "place" && selected) {
      // Check if building fits within available chunks (multi-chunk check)
      const buildingChunks = getChunksForBuilding(
        globalX,
        globalY,
        selected.w,
        selected.h
      );
      const allChunksAvailable = buildingChunks.every(
        ([chunkX, chunkY]) => availableChunks[`${chunkX},${chunkY}`]
      );

      if (!allChunksAvailable) {
        setHoverPosition(null);
        return;
      }

      const area = { x: globalX, y: globalY, w: selected.w, h: selected.h };

      // Check collision with existing buildings
      for (const b of buildings) {
        const bArea = { x: b.x, y: b.y, w: b.w, h: b.h };
        if (rectsOverlap(area, bArea)) {
          setHoverPosition(null);
          return;
        }
      }

      setHoverPosition({
        x: globalX,
        y: globalY,
        w: selected.w,
        h: selected.h,
      });
    } else if (mode === "move" && selectedForMove) {
      // Show move preview
      const buildingChunks = getChunksForBuilding(
        globalX,
        globalY,
        selectedForMove.w,
        selectedForMove.h
      );
      const allChunksAvailable = buildingChunks.every(
        ([chunkX, chunkY]) => availableChunks[`${chunkX},${chunkY}`]
      );

      if (!allChunksAvailable) {
        setHoverPosition(null);
        return;
      }

      const area = {
        x: globalX,
        y: globalY,
        w: selectedForMove.w,
        h: selectedForMove.h,
      };

      // Check collision
      for (const b of buildings) {
        if (b.id === selectedForMove.id) continue;
        const bArea = { x: b.x, y: b.y, w: b.w, h: b.h };
        if (rectsOverlap(area, bArea)) {
          setHoverPosition(null);
          return;
        }
      }

      setHoverPosition({
        x: globalX,
        y: globalY,
        w: selectedForMove.w,
        h: selectedForMove.h,
        isMove: true,
      });
    } else {
      setHoverPosition(null);
    }
  }

  function handleGridMouseLeave() {
    setHoverPosition(null);
  }

  // Determine building CSS class based on mode
  const getBuildingClass = (building) => {
    const baseClass = "building";

    if (mode === "move" && selectedForMove?.id === building.id) {
      return `${baseClass} selected-for-move movable`;
    }

    if (mode === "collect") {
      return `${baseClass} collect-mode`;
    }

    if (mode === "sell") {
      return `${baseClass} sell-mode`;
    }

    return baseClass;
  };

  return (
    <div className="grid-container" onMouseLeave={handleGridMouseLeave}>
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
                      onMouseEnter={(e) => handleCellHover(e, chunk)}
                    />
                  ))}
                </div>
              ))}
            </div>
          );
        })}

        {/* Hover visualization */}
        {hoverPosition && (
          <div
            className={`building-hover ${
              hoverPosition.isMove ? "move-hover" : ""
            }`}
            style={{
              left: (hoverPosition.x - minCx * 4) * cellSize,
              top: (hoverPosition.y - minCy * 4) * cellSize,
              width: hoverPosition.w * cellSize,
              height: hoverPosition.h * cellSize,
            }}
          >
            {hoverPosition.isMove ? selectedForMove?.name : selected?.name}
          </div>
        )}

        {/* Existing buildings */}
        {buildings.map((b) => (
          <div
            key={b.id}
            className={getBuildingClass(b)}
            style={{
              left: (b.x - minCx * 4) * cellSize,
              top: (b.y - minCy * 4) * cellSize,
              width: b.w * cellSize,
              height: b.h * cellSize,
            }}
            onClick={() => onBuildingClick(b)}
          >
            {b.name}
            {mode === "move" && selectedForMove?.id === b.id && (
              <div className="move-indicator">✓</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
