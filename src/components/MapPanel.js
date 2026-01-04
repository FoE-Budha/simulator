import React, { useMemo, useEffect, useState } from "react";
import Grid from "./grid/Grid";
import { uuid } from "../utils";

// Mode constants
const MODES = {
  PLACE: 'place',
  MOVE: 'move',
  COLLECT: 'collect',
  SELL: 'sell'
};

export default function MapPanel({
  chunksMap,
  buildings,
  selectedType,
  onPlace,
  onChunkClick,
  onCollect,
  onSell,
  onMove,
  setChunksMap,
}) {
  const [mode, setMode] = useState(MODES.PLACE);
  const [selectedForMove, setSelectedForMove] = useState(null);
  
  // Initialize chunks
  useEffect(() => {
    if (Object.keys(chunksMap).length === 0) {
      const initialChunks = {};
      
      const nonExistingChunks = [
        [0, 0],
        [1, 0],
        [6, 0],
        [0, 1],
        [0, 2],
        [0, 3],
        [6, 5],
        [6, 6],
      ];

      const unlockedChunks = [
        [2, 1],
        [2, 2],
        [2, 3],
        [3, 1],
        [3, 2],
        [3, 3],
        [4, 1],
        [4, 2],
        [4, 3],
        [5, 1],
        [5, 2],
        [5, 3],
      ];
      
      for (let cx = 0; cx <= 6; cx++) {
        for (let cy = 0; cy <= 6; cy++) {
          const isNonExisting = nonExistingChunks.some(
            ([nx, ny]) => nx === cx && ny === cy
          );
          if (isNonExisting) continue;
          
          const key = `${cx},${cy}`;
          const isUnlocked = unlockedChunks.some(
            ([ux, uy]) => ux === cx && uy === cy
          );
          
          let state = isUnlocked ? "available" : "locked";
          
          initialChunks[key] = {
            id: uuid("chunk_"),
            cx,
            cy,
            state
          };
        }
      }
      
      setChunksMap(initialChunks);
    }
  }, []);

  // Handle building click based on current mode
  const handleBuildingClick = (building) => {
    switch (mode) {
      case MODES.MOVE:
        // Select building for moving
        setSelectedForMove(building);
        break;
        
      case MODES.COLLECT:
        // Collect from building
        onCollect(building);
        break;
        
      case MODES.SELL:
        // Sell building
        onSell(building);
        break;
        
      default:
        // In place mode, clicking sells (backward compatibility)
        onSell(building);
        break;
    }
  };

  // Handle grid cell click
  const handlePlace = (x, y) => {
    if (mode === MODES.PLACE && selectedType) {
      onPlace(x, y);
    } else if (mode === MODES.MOVE && selectedForMove) {
      // Move selected building to new location
      onMove(selectedForMove.id, x, y);
      setSelectedForMove(null);
    }
  };

  // Handle clear mode
  const handleClearMode = () => {
    setMode(MODES.PLACE);
    setSelectedForMove(null);
  };

  // Get mode description
  const getModeDescription = () => {
    switch (mode) {
      case MODES.PLACE:
        return "Click on grid to place selected building";
      case MODES.MOVE:
        return selectedForMove 
          ? `Moving ${selectedForMove.name}. Click where to move it`
          : "Click a building to select it for moving, then click where to move it";
      case MODES.COLLECT:
        return "Click buildings to collect resources";
      case MODES.SELL:
        return "Click buildings to sell them";
      default:
        return "";
    }
  };

  return (
    <div style={{ flex: 1, padding: 12 }}>
      {/* Header with mode controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <strong>Map</strong>

        <div style={{ display: "flex", gap: 8 }}>
          {/* Mode buttons */}
          <button
            className={`button small ${mode === MODES.PLACE ? 'active' : ''}`}
            onClick={() => {
              setMode(MODES.PLACE);
              setSelectedForMove(null);
            }}
            style={{
              background: mode === MODES.PLACE ? "#06b6d4" : "rgba(255,255,255,0.1)",
              color: mode === MODES.PLACE ? "#021827" : "#e6eef8"
            }}
          >
            Place
          </button>
          
          <button
            className={`button small ${mode === MODES.MOVE ? 'active' : ''}`}
            onClick={() => {
              setMode(MODES.MOVE);
              setSelectedForMove(null);
            }}
            style={{
              background: mode === MODES.MOVE ? "#06b6d4" : "rgba(255,255,255,0.1)",
              color: mode === MODES.MOVE ? "#021827" : "#e6eef8"
            }}
          >
            Move
          </button>
          
          <button
            className={`button small ${mode === MODES.COLLECT ? 'active' : ''}`}
            onClick={() => {
              setMode(MODES.COLLECT);
              setSelectedForMove(null);
            }}
            style={{
              background: mode === MODES.COLLECT ? "#10b981" : "rgba(255,255,255,0.1)",
              color: mode === MODES.COLLECT ? "#021827" : "#e6eef8"
            }}
          >
            Collect
          </button>
          
          <button
            className={`button small ${mode === MODES.SELL ? 'active' : ''}`}
            onClick={() => {
              setMode(MODES.SELL);
              setSelectedForMove(null);
            }}
            style={{
              background: mode === MODES.SELL ? "#ef4444" : "rgba(255,255,255,0.1)",
              color: mode === MODES.SELL ? "#021827" : "#e6eef8"
            }}
          >
            Sell
          </button>
        </div>
      </div>

      {/* Mode instructions */}
      <div style={{ 
        marginBottom: "12px", 
        fontSize: "12px", 
        color: "#94a3b8",
        padding: "8px",
        background: "rgba(255,255,255,0.03)",
        borderRadius: "4px",
        minHeight: "40px",
        display: "flex",
        alignItems: "center"
      }}>
        <div>
          <strong>Mode:</strong> {mode.toUpperCase()}
          <span style={{ marginLeft: "12px" }}>{getModeDescription()}</span>
          {selectedForMove && (
            <span style={{ 
              marginLeft: "12px", 
              color: "#06b6d4",
              background: "rgba(6, 182, 212, 0.1)",
              padding: "2px 8px",
              borderRadius: "4px"
            }}>
              Selected: {selectedForMove.name}
            </span>
          )}
        </div>
      </div>

      {/* Grid container */}
      <div
        style={{
          border: "1px solid rgba(255,255,255,0.04)",
          borderRadius: "6px",
          overflow: "auto",
          padding: 8,
          background: "linear-gradient(180deg,#0b1a2a,#081422)",
          minHeight: "400px",
        }}
      >
        <Grid
          chunksMap={chunksMap}
          buildings={buildings}
          selected={mode === MODES.PLACE ? selectedType : null}
          selectedForMove={selectedForMove}
          mode={mode}
          onPlace={handlePlace}
          onBuildingClick={handleBuildingClick}
          onChunkAction={onChunkClick}
          cellSize={32}
        />
      </div>
    </div>
  );
}