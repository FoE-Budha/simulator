import React from "react";

export default function MapPanel({
  cols,
  rows,
  cellSize,
  buildings,
  minCy,
  minCx,
  maxCx,
  handleGridClick,
  handleCollect,
  handleSell,
  setChunksMap,
  setBuildings,
  uuid,
}) {
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
          <button
            onClick={() => {
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
            onClick={() => confirm("Clear all buildings?") && setBuildings([])}
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
          {/* grid */}
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} style={{ display: "flex" }}>
              {Array.from({ length: cols }).map((_, c) => (
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
                  confirm("Collect? OK=collect / Cancel=sell")
                    ? handleCollect(b.id)
                    : handleSell(b.id);
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
  );
}
