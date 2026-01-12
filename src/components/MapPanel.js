import React, { useMemo, useEffect, useState } from "react";
import Grid from "./grid/Grid";
import { uuid } from "../utils";
import "./MapPanel.css";

// Mode constants
const MODES = {
  PLACE: "place",
  MOVE: "move",
  COLLECT: "collect",
  SELL: "sell",
  SPEEDUP: "speedup",
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
  gameTime = 0,
  skipTime,
  collectAllReady,
  readyToCollectCount = 0,
  speedUpWithShards,
}) {
  const [mode, setMode] = useState(MODES.PLACE);
  const [selectedForMove, setSelectedForMove] = useState(null);

  // Initialize chunks
  useEffect(() => {
    if (Object.keys(chunksMap).length === 0) {
      const initialChunks = {};
      const nonExistingChunks = [
        [0, 0], [1, 0], [6, 0], [0, 1],
        [0, 2], [0, 3], [6, 5], [6, 6],
      ];
      const unlockedChunks = [
        [2, 1], [2, 2], [2, 3], [3, 1],
        [3, 2], [3, 3], [4, 1], [4, 2],
        [4, 3], [5, 1], [5, 2], [5, 3],
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
            state,
          };
        }
      }
      setChunksMap(initialChunks);
    }
  }, []);

  // Handle building click - mode-specific logic
  const handleBuildingClick = (building) => {
    switch (mode) {
      case MODES.PLACE:
      setMode(MODES.MOVE);
      setSelectedForMove(building);
      break;
      case MODES.MOVE:
        setSelectedForMove(building);
        break;
      case MODES.COLLECT:
        onCollect(building);
        break;
      case MODES.SELL:
        onSell(building);
        break;
      case MODES.SPEEDUP:  
        speedUpWithShards(building);
        break;
    }
  };

  // Handle grid placement/move - mode-specific logic
  const handleGridPlace = (x, y) => {
    if (mode === MODES.PLACE && selectedType) {
      onPlace(x, y);
    } else if (mode === MODES.MOVE && selectedForMove) {
      onMove(selectedForMove.id, x, y);
      setSelectedForMove(null);
    }
  };

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
      case MODES.SPEEDUP:  // ADD THIS
        return "Click buildings to speed them up with shards";
      default:
        return "";
    }
  };

  return (
    <div className="map-panel">
      {/* TIME CONTROL PANEL */}
      <div className="time-control-panel">
        <div className="time-control-header">
          <div className="time-control-title">
            ⏱️ Time Controls
          </div>
          
          <div className="time-control-buttons">
            <button
              className="time-button time-button-1h"
              onClick={() => skipTime && skipTime(1)}
            >
              ⏩ Wait 1h
            </button>

            <button
              className="time-button time-button-10h"
              onClick={() => skipTime && skipTime(10)}
            >
              ⏩⏩ Wait 10h
            </button>

            <button
              className={`time-button time-button-collect-all ${
                readyToCollectCount > 0 ? "active" : "inactive"
              }`}
              onClick={() => readyToCollectCount > 0 && collectAllReady()}
              disabled={readyToCollectCount === 0}
            >
              ⚡ Collect All {readyToCollectCount > 0 && `(${readyToCollectCount})`}
            </button>

            <button
              className={`time-button time-button-shards ${mode === MODES.SPEEDUP ? "active" : ""}`}
              onClick={() => {
                setMode(mode === MODES.SPEEDUP ? MODES.PLACE : MODES.SPEEDUP);
              }}
            >
              ✨ Speed up with Shards {mode === MODES.SPEEDUP && "✓"}
            </button>
          </div>
        </div>
      </div>

      {/* MODE INSTRUCTION PANEL */}
      <div className="mode-instruction-panel">
        <div className="mode-controls">
          <button
            className={`mode-button mode-button-place ${
              mode === MODES.PLACE ? "active" : ""
            }`}
            onClick={() => {
              setMode(MODES.PLACE);
              setSelectedForMove(null);
            }}
          >
            Place
          </button>

          <button
            className={`mode-button mode-button-move ${
              mode === MODES.MOVE ? "active" : ""
            }`}
            onClick={() => {
              setMode(MODES.MOVE);
              setSelectedForMove(null);
            }}
          >
            Move
          </button>

          <button
            className={`mode-button mode-button-collect ${
              mode === MODES.COLLECT ? "active" : ""
            }`}
            onClick={() => {
              setMode(MODES.COLLECT);
              setSelectedForMove(null);
            }}
          >
            Collect
          </button>

          <button
            className={`mode-button mode-button-sell ${
              mode === MODES.SELL ? "active" : ""
            }`}
            onClick={() => {
              setMode(MODES.SELL);
              setSelectedForMove(null);
            }}
          >
            Sell
          </button>
        </div>

        <div className="mode-info">
          <div className="mode-description">
            {getModeDescription()}
            {selectedForMove && (
              <span className="selected-building">
                Selected: {selectedForMove.name}
              </span>
            )}
          </div>
        </div>

        <div className="game-time-display">
          ⏰ Game Time: <strong>{gameTime}h</strong>
        </div>
      </div>

      {/* GRID CONTAINER */}
      <div className="grid-area">
        <Grid
          chunksMap={chunksMap}
          buildings={buildings}
          selected={mode === MODES.PLACE ? selectedType : null}
          selectedForMove={selectedForMove}
          mode={mode}
          onPlace={handleGridPlace}
          onBuildingClick={handleBuildingClick}
          onChunkAction={onChunkClick}
          cellSize={32}
        />
      </div>
    </div>
  );
}