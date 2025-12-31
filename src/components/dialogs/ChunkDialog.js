import React from "react";

export default function ChunkDialog({ chunk, onClose, onUnlock }) {
  if (!chunk) return null;

  const unlockCost = 1000;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--panel)",
          padding: "24px",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.1)",
          minWidth: "300px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0 }}>
          Chunk ({chunk.cx}, {chunk.cy})
        </h3>

        <div style={{ marginBottom: "16px" }}>
          <strong>Status:</strong> {chunk.state}
        </div>

        {chunk.state === "locked" && (
          <div>
            <p>This chunk is locked. Unlock it to build here.</p>
            <p>Cost: {unlockCost} coins</p>
            <button
              className="button"
              onClick={() => onUnlock({ type: "coins", amount: unlockCost })}
            >
              Unlock with Coins
            </button>
          </div>
        )}

        {chunk.state === "blocked" && (
          <div>
            <p>This chunk is blocked. Clear obstacles to build here.</p>
            <p>Cost: {unlockCost} supplies</p>
            <button
              className="button"
              onClick={() => onUnlock({ type: "supplies", amount: unlockCost })}
            >
              Clear with Supplies
            </button>
          </div>
        )}

        <div
          style={{
            marginTop: "24px",
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
          }}
        >
          <button className="button small" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
