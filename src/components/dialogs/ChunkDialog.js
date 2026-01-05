import React, { useState, useEffect } from "react";

export default function ChunkDialog({ chunk, onClose, onUnlock }) {
  if (!chunk) return null;

  // Track how many unlocks have been made
  const [unlockCounts, setUnlockCounts] = useState({
    shards: 0,
    goods: 0,
  });

  // Shard pricing progression
  const shardPrices = [
    100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800,
    850, 900, 950,
  ];

  // Goods pricing progression
  const goodsPrices = [30, 60, 90, 130, 180, 240, 310, 390, 480, 580, 700];

  // Get current prices
  const getCurrentShardPrice = () => {
    return shardPrices[Math.min(unlockCounts.shards, shardPrices.length - 1)];
  };

  const getCurrentGoodsPrice = () => {
    return goodsPrices[Math.min(unlockCounts.goods, goodsPrices.length - 1)];
  };

  const currentShardPrice = getCurrentShardPrice();
  const currentGoodsPrice = getCurrentGoodsPrice();

  // Handle unlock with shards
  const handleShardUnlock = () => {
    onUnlock({
      type: "shards",
      amount: currentShardPrice,
    });
    setUnlockCounts((prev) => ({
      ...prev,
      shards: prev.shards + 1,
    }));
  };

  // Handle unlock with goods
  const handleGoodsUnlock = () => {
    onUnlock({
      type: "goods",
      amount: currentGoodsPrice,
    });
    setUnlockCounts((prev) => ({
      ...prev,
      goods: prev.goods + 1,
    }));
  };

  // Initialize counts
  useEffect(() => {
    setUnlockCounts({ shards: 0, goods: 0 });
  }, [chunk]);

  // Escape key to close
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

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
          background: "#2a2a2a",
          padding: "20px",
          borderRadius: "8px",
          minWidth: "300px",
          border: "1px solid #444",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0, marginBottom: "15px" }}>
          Chunk ({chunk.cx}, {chunk.cy})
        </h3>

        <div style={{ marginBottom: "20px", color: "#aaa" }}>
          This chunk is locked. Unlock it to build here.
        </div>

        {/* Shards Option */}
        <div style={{ marginBottom: "15px" }}>
          <div style={{ marginBottom: "8px" }}>
            <strong>Unlock with Shards</strong>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "10px",
            }}
          >
            <span>Cost: {currentShardPrice} Shards</span>
            <span>Unlock #{unlockCounts.shards + 1}</span>
          </div>
          <button
            style={{
              width: "100%",
              padding: "10px",
              background: "#667eea",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            onClick={handleShardUnlock}
          >
            Unlock with Shards
          </button>
        </div>

        {/* Goods Option */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ marginBottom: "8px" }}>
            <strong>Clear with Goods</strong>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "10px",
            }}
          >
            <span>Cost: {currentGoodsPrice} Goods</span>
            <span>Clear #{unlockCounts.goods + 1}</span>
          </div>
          <button
            style={{
              width: "100%",
              padding: "10px",
              background: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            onClick={handleGoodsUnlock}
          >
            Clear with Goods
          </button>
        </div>

        {/* Progression Info */}
        <div
          style={{
            fontSize: "0.9em",
            color: "#888",
            marginBottom: "20px",
            padding: "10px",
            background: "rgba(255,255,255,0.05)",
            borderRadius: "4px",
          }}
        >
          <div>
            Shards unlocks: {unlockCounts.shards} (next: {currentShardPrice})
          </div>
          <div>
            Goods clears: {unlockCounts.goods} (next: {currentGoodsPrice})
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <button
            style={{
              padding: "8px 16px",
              background: "#555",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
