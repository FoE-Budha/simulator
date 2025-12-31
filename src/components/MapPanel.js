import React, { useMemo } from "react";
import Grid from "../components/grid/Grid";
import { uuid } from "../utils";

export default function MapPanel({
  chunksMap,
  buildings,
  selectedType,
  onPlace,
  onChunkClick,
  onCollect,
  onSell,
  setChunksMap,
}) {
  // Initialize chunks if empty
  React.useEffect(() => {
    if (Object.keys(chunksMap).length === 0) {
      const initialChunks = {
        "0,0": {
          id: uuid("chunk_"),
          cx: 0,
          cy: 0,
          state: "available",
        },
        "1,0": {
          id: uuid("chunk_"),
          cx: 1,
          cy: 0,
          state: "locked",
        },
        "0,1": {
          id: uuid("chunk_"),
          cx: 0,
          cy: 1,
          state: "blocked",
        },
      };
      setChunksMap(initialChunks);
    }
  }, []);

  const handlePlace = (building) => {
    onPlace(building.x, building.y);
  };

  const handleRemove = (buildingId) => {
    const building = buildings.find((b) => b.id === buildingId);
    if (building) {
      onSell(building);
    }
  };

  const handleAddChunk = () => {
    const keys = Object.keys(chunksMap);
    let maxCx = -Infinity;
    let minCy = Infinity;

    keys.forEach((k) => {
      const [cx, cy] = k.split(",").map(Number);
      maxCx = Math.max(maxCx, cx);
      minCy = Math.min(minCy, cy);
    });

    const newCx = maxCx + 1;
    const newCy = minCy;
    const newKey = `${newCx},${newCy}`;

    setChunksMap((prev) => ({
      ...prev,
      [newKey]: {
        id: uuid("chunk_"),
        cx: newCx,
        cy: newCy,
        state: Math.random() > 0.5 ? "available" : "locked",
      },
    }));
  };

  const handleClear = () => {
    if (window.confirm("Clear all buildings?")) {
      // Clear buildings - you'll need to pass setBuildings or handle this differently
      console.log("Clear buildings - implement this in parent component");
    }
  };

  return (
    <div style={{ flex: 1, padding: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <strong>Map</strong>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="button small" onClick={handleAddChunk}>
            Add 4x4 section
          </button>

          <button className="button small" onClick={handleClear}>
            Clear
          </button>
        </div>
      </div>

      <div
        style={{
          border: "1px solid rgba(255,255,255,0.04)",
          borderRadius: "6px",
          overflow: "auto",
          padding: 8,
          background: "linear-gradient(180deg,#0b1a2a,#081422)",
        }}
      >
        <Grid
          chunksMap={chunksMap}
          buildings={buildings}
          selected={selectedType}
          onPlace={handlePlace}
          onRemove={handleRemove}
          onChunkAction={onChunkClick}
          cellSize={32}
        />
      </div>
    </div>
  );
}
